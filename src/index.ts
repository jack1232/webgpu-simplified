import { vec3, mat4 } from 'gl-matrix';
const camera = require('3d-view-controls');
import * as Stats from 'stats.js';
import { GUI } from 'dat.gui';

// #region WebGPU initialization **************************************************************

/**
 * Interface as input of the `initWebGPU` function.
 */
export interface IWebGPUInitInput {
    /** HTML canvas element */
    canvas: HTMLCanvasElement;
    /** The GPU texture format */
    format?: GPUTextureFormat;
    /** MSAA count (1 or 4) */
    msaaCount?: number;
}

/**
 * Interface as output of the `initWebGPU` function. 
 */
export interface IWebGPUInit {
    /** The GPU device */
    device?: GPUDevice;
    /** The GPU canvas context */
    context?: GPUCanvasContext;
    /** The GPU texture format */
    format?: GPUTextureFormat;
    /** The canvas size */
    size?: {width: number, height: number};
    /** The background color for the scene */
    background?: {r: number, g: number, b: number, a: number};
    /** MSAA count (1 or 4) */
    msaaCount?: number;
}

/**
 * This function is used to initialize the WebGPU apps. It returns the IWebGPUInit interface.
 * 
 * @param input - The input argument of the `IWebGPUInitInput` interface type with default members:
 * 
 * `input.format = navigator.gpu.getPreferredCanvasFormat()` 
 * 
 * `input.msaa.Count = 1`
 */
export const initWebGPU = async (input: IWebGPUInitInput): Promise<IWebGPUInit> => {
    // set default parameters
    input.format = input.format === undefined? navigator.gpu.getPreferredCanvasFormat(): input.format;
    input.msaaCount = input.msaaCount === undefined? 1: input.msaaCount;
    
    if(checkWebGPUSupport.includes('does not support WebGPU')){
        throw(checkWebGPUSupport);
    }
    
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
    const context = input.canvas.getContext('webgpu') as GPUCanvasContext;
    const pixelRatio = window.devicePixelRatio || 1;
    input.canvas.width = input.canvas.clientWidth * pixelRatio;
    input.canvas.height = input.canvas.clientHeight * pixelRatio;
    const size = {width: input.canvas.width, height: input.canvas.height};
    context.configure({
        device: device,
        format: input.format,
        alphaMode: 'opaque',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
    });
    const background = { r: 0.009, g: 0.0125, b: 0.0164, a: 1.0 };
    return {device, context, format:input.format, size, background, msaaCount:input.msaaCount};    
}

/** A string variable used to check whether your browser supports WebGPU or not.*/
export const checkWebGPUSupport = navigator.gpu? 'Great, your current browser supports WebGPU!' : 
    `Your current browser does not support WebGPU! Make sure you are on a system 
    with WebGPU enabled.`;

// #endregion WebGPU initialization ***********************************************************


// #region Pipeline Descriptor ****************************************************************

/**
 * Interface as the output of a render pipeline.
 */
export interface IPipeline {
    /** The render pipeline array */
    pipelines?: GPURenderPipeline[],
    /** The compute pipeline array */
    csPipelines?: GPUComputePipeline[],
    /** The GPU texture array */
    gpuTextures?: GPUTexture[],
    /** The depth texture array */
    depthTextures?: GPUTexture[],
    /** The vertex buffer array */
    vertexBuffers?: GPUBuffer[],
    /** The uniform buffer array */
    uniformBuffers?: GPUBuffer[],
    /** The uniform bind group array */
    uniformBindGroups?: GPUBindGroup[],
    /** The number of vertices */
    numVertices?: number,
    /** The number of instances */
    numInstances?: number,
}

/** Interface as input of the `createRenderPipelineDescriptor` function. */
export interface IRenderPipelineInput {
    /** The IWebGPU interface */
    init: IWebGPUInit,
    /** The GPU primative topology with default `'triangle-list'` */
    primitiveType?: GPUPrimitiveTopology,
    /** The GPU index format (undefined for `'list'` primitives or `'uint32'` for `'strip'` primitives) */
    indexFormat?: GPUIndexFormat,
    /** The GPU cull mode - defines which polygon orientation will be culled */
    cullMode?: GPUCullMode,
    /** The boolean variable - indicates whether the render pipeline should include a depth stencial state or not */
    isDepthStencil?: boolean,
    /** The `buffers` attribute of the vertex state in a render pipeline descriptor */
    buffers?: Iterable<GPUVertexBufferLayout>,
    /** The WGSL shader that contains both vertex and fragment shaders */
    shader?: string,
    /** The WGSL vertex shader */
    vsShader?: string,
    /** The WGSL fragment shader */
    fsShader?: string,
    /** The entry point for the vertex shader. Default `'vs_main'`  */
    vsEntry?: string,
    /** The entry point for the fragment shader. Default `'fs_main'`  */
    fsEntry?: string,
}

/**
 * This function creates the render pipeline descriptor that will be used to create a render pipeline.
 * 
 * @param input - The `input` argument is a type of the `IRenderPipelineInput` interface with the following default values:
 * `input.primitiveType`: `'triangle-list'`, `input.cullMode`: `'none'`, `input.isDepthStencil`: `true`, 
 * `input.vsEntry`: `'vs_main'`,  `input.fsEntry`: `'fs_main'`. If `input.shader` is specified, then
 * `input.vsShader = input.shader` and `input.fsShader = input.shader` 
 * 
 * @param withFragment - Indicates whether the GPU fragment state should be included or not. Default value is `true`. 
 * If it is set to `false`, the render pipeline will not produce any color attachment outputs. For example, we do not
 * need any color output when rendering shadows, so we can set this parameter to `false` in this case 
 * @returns The render pipeline descriptor.
 */
export const createRenderPipelineDescriptor = (input: IRenderPipelineInput, withFragment = true): GPURenderPipelineDescriptor => {
    input.primitiveType = input.primitiveType === undefined? 'triangle-list': input.primitiveType;
    input.cullMode = input.cullMode === undefined? 'none': input.cullMode;
    input.isDepthStencil = input.isDepthStencil === undefined? true: input.isDepthStencil;
    input.vsEntry = input.vsEntry === undefined? 'vs_main': input.vsEntry;
    input.fsEntry = input.fsEntry === undefined? 'fs_main': input.fsEntry;

    if(input.shader){
        input.vsShader = input.shader;
        input.fsShader = input.shader;
    }

    input.indexFormat = input.indexFormat === undefined? 'uint32': input.indexFormat;
    let indexFormat: GPUIndexFormat = undefined;
    if(input.primitiveType.includes('strip')) {
        indexFormat = input.indexFormat;
    }

    let descriptor: GPURenderPipelineDescriptor = {
        layout:'auto',
        vertex: {
            module: input.init.device.createShaderModule({                    
                code: input.vsShader,
            }),
            entryPoint: input.vsEntry,
            buffers: input.buffers,
        },
        fragment: withFragment? {
            module: input.init.device.createShaderModule({                    
                code: input.fsShader,
            }),
            entryPoint: input.fsEntry,
            targets: [
                {
                    format: input.init.format
                }
            ],
        }: undefined,
        primitive:{
            topology: input.primitiveType,
            stripIndexFormat: indexFormat,
            cullMode: input.cullMode,
        },
        multisample: {
            count: input.init.msaaCount,
        }
    };

    if(input.isDepthStencil) {
        descriptor.depthStencil = {
            format: "depth24plus",
            depthWriteEnabled: true,
            depthCompare: "less"
        };
    }
    return descriptor;
}


/**
 * This function create a compute pipeline descriptor that will be used to create a compute pipeline.
 * @param device GPU Device
 * @param csShader the WGSL compute shader 
 * @param entry the entry point for teh compute shader
 * @returns the compute pipeline descriptor.
 */
export const createComputePipelineDescriptor = (device: GPUDevice, csShader: string, entry = 'cs_main'): GPUComputePipelineDescriptor => {
    return {
        layout:'auto',
        compute: {
            module: device.createShaderModule({
                code: csShader,
            }),
            entryPoint: 'cs_main',
        }
    };
}

/**
 * This function sets the `buffers` attribute of the vertex state in a render pipeline. In this function, the input argument
 * `formats` is a GPU vertex-format array. It can be specified as `'float32'`, `'float32x2'`,
 * `'float32x3'`, `'float32x4'`, etc., which correspond to the WGSL style in the shader `f32`, `vec2<f32>`, 
 * `vec3<f32>`, `vec4<f32>`, etc. If the vertex data is stored in a separate buffer for each attribute such as position,
 * normal, and UV, you can simply provide only this input argument like `['float32x3', 'float32x3', 'float32x2']` and 
 * ignore all the other optional arguments. In this case, the `setVertexBuffers` function will automatically 
 * calculate the `offset`, `arrayStride`, and `shaderLocation` for each vertex attribute. Note that the `shaderLocation` 
 * is set with an array filled with consecutive numbers like [0, 1, 2], which must match the  `@location` attribute specified 
 * in the vertex shader. Otherwise, you need to manually specify the `shaderLocations` array argument.
 * 
 * On the other hand, if you store the vertex data in a single buffer for all attributes (e.g., position, normal, and uv), you 
 * will need to provide not only the vertex `formats` array, but also the `offsets` array. Here is an example
 * of a single buffer that stores the `position` (`vec3<f32>`), `normal` (`vec3<f32>`), and `uv` (`vec2<f32>`) data. 
 * The corresponding  `arrayStride` will be 12, 12, and 8, and the `offsets` array will be [0, 12, 24]. 
 * In this case, you can set the `buffers` attribute by calling the function like this: 
 * 
 * `const bufs = setVertexBuffers(['float32x3', 'float32x3', 'float32x2'], [0, 12, 24]);`
 * 
 * The above example assumes that all the vertex attributes (position, normal, and uv) stored in a 
 * single buffer are used in the pipeline and vertex shader. What happens if not all the attributes in the buffer are needed. 
 * For example, the pipeline and shader only need the `position` and `uv` data, but not the `normal` data. In this case,
 * in addition to the `formats` and `offsets` arguments, you will also need to specify the `totalArrayStride`
 * argument. The `arrayStride` for `position`, `normal`, and `uv` is 12, 12, and 8, respectively, so the 
 * `totalArrayStride` = 12 + 12 + 8 = 32. Thus, we can create the `buffers` attribute using the following code
 * 
 * `const bufs = setVertexBuffers(['float32x3', 'float32x2'], [0, 24], 32);`
 * 
 * Note that the `offsets` array is set to [0, 24] rather than [0, 12], because the `uv` data starts after `position` and 
 * `normal` data, while the `normal` data is still stored in the buffer even though it is not used in this example.
 * 
 * @param formats GPU vertex format array with each element specifying the `GPUVertexFormat` of teh attribute. 
 * @param offsets The offset array that is optional. The offset, in bytes, is counted from the beginning of the element to the data 
 * for the attribute. Note that the offset must be a multiple of the minimum of 4 and sizeof the `attrib.format`.
 * @param totalArrayStride The stride, in bytes, between elements of the array. This is an optional argument.
 * @param shaderLocations The numeric location associated with the attribute, such as position, normal, or uv, which will 
 * correspond with a `@location` attribute declared in the vertex shader. This is an optional argument.
 * @returns An array of GPU vertex buffer layout.
 */
export const setVertexBuffers = (formats: GPUVertexFormat[], 
    offsets:number[] = [], totalArrayStride = 0, shaderLocations:number[] = []): Iterable<GPUVertexBufferLayout> => {
    const len = formats.length
    const len1 = offsets.length;
    const len2 = shaderLocations.length;
    let buffers = [];
    if(len1 === 0){
        for(let i = 0; i < len; i++){
            let stride = 4 * parseInt(formats[i].split('x')[1]);
            let loc = len2 === 0? i: shaderLocations[i];
            buffers.push({
                arrayStride: stride,
                attributes: [{
                    shaderLocation: loc,
                    format: formats[i],
                    offset: 0,
                }]
            },);
        }
    } else {
        let attributes = [];
        let strides = 0;
        for(let i = 0; i < len1; i++){
            strides += 4 * parseInt(formats[i].split('x')[1]);
            let loc = len2 === 0? i: shaderLocations[i];
            attributes.push({
                shaderLocation: loc,
                format: formats[i],
                offset: offsets[i],
            });
        }
        if(totalArrayStride > 0) {
            strides = totalArrayStride;
        }
        buffers = [{            
            arrayStride: totalArrayStride,
            attributes: attributes as Iterable<GPUVertexAttribute>
        }];
    }
    return buffers; 
}

// #endregion Pipeline Descriptor *************************************************************


// #region Render pass descriptor *************************************************************

/** Interface as input of the `createRenderPassDescriptor` function. */
export interface IRenderPassInput {
    /** The IWebGPUInit interface */
    init?: IWebGPUInit,
    /** The GPU texture view */
    textureView?: GPUTextureView,
    /** The depth texture view */
    depthView?: GPUTextureView,
}

/**
 * This function creates the render pass descriptor that will be used to create a render pass with various options. 
 * The returned desciptor will include a depth-stencil attachment if the depth texture view is provided via the input
 * interface `IRenderPassInput`. Otherwise, the depth stencil attachment will not be defined. The argument 
 * `withColorAttachment` indicates whether the descriptor should contain color attachments or not. In addition, you can
 * specify the MSAA count parameter.  
 * @param input The type of interface `IRenderPassInput`
 * @param withColorAttachment Indicates whether the descriptor should contain color attachments or not
 */
export const createRenderPassDescriptor = (input: IRenderPassInput, withColorAttachment = true): GPURenderPassDescriptor => {    
    const colorAttachmentView = input.init.msaaCount > 1? input.textureView: 
        input.init.context.getCurrentTexture().createView();
    const colorAttachmentResolveTarget = input.init.msaaCount>1?
        input.init.context.getCurrentTexture().createView(): undefined;

    const descriptor: GPURenderPassDescriptor = {
        colorAttachments: withColorAttachment? [{
            view: colorAttachmentView,
            resolveTarget: colorAttachmentResolveTarget,
            clearValue: input.init.background,
            loadOp:'clear',
            storeOp: 'store'
        }] as Iterable<GPURenderPassColorAttachment>: [],
        depthStencilAttachment: input.depthView? {
            view: input.depthView,
            depthClearValue: 1.0,
            depthLoadOp:"clear",
            depthStoreOp: "store",
        } as GPURenderPassDepthStencilAttachment: undefined,
    }
    
    return descriptor;
}
// #endregion Render pass descriptor **********************************************************


// #region Create, Update GPU Buffers and Bind Group ******************************************

/** The enumeration for specifying the type of a GPU buffer. */
export enum BufferType {
    /** Uniform buffer */
    Uniform,
    /** Vertex buffer */
    Vertex,
    /** Index buffer */
    Index,
    /** Storage buffer */
    Storage,
    /** vertex-Storage buffer */
    VertexStorage,
    /** Index-Storage buffer */
    IndexStorage,
}

/**
 * This function updates the vertex buffers when the vertex data is changed by varying some parameters by the user. 
 * Let's take the UV sphere as an example. A UV sphere can have three parameters: radius, u-segments, and v-segments. 
 * Varying the radius parameter only changes the data values but not the buffer size, while warying the u- (or v-) 
 * segments parameter will change both the data values and buffer size. In the former case, we can write the 
 * new data directly into the original buffers; while in the latter case, we have to destroy the original buffers and recreate 
 * the new buffers with new buffer size, and then write the new data into the newly created buffers. Here, we check whether the buffer
 * size is changed or not by comparing the length of the original data (called `origNumVertices`) with that of the new data.    
 * @param device GPU device
 * @param p Interface of `IPipeline`
 * @param data An array of vertex data. Note that this array should include the `index` data. For example, if a render pipeline 
 * has `position`, `normal`, and `uv`, then this `data` array should defined by 
 * 
 * `const data = [dat.positions, dat.normals, dat.uvs, dat.indices];`
 * 
 * Of course, for this data array, you also need to define corresponding vertex buffer array in the render pipeline:
 * 
 * `p.vertexBuffers = [positonBuffer, normalBuffer, uvBuffer, indexBuffer];`
 * 
 * If the data is generated in such a way that the vertex data contains all attributes (`position`, `normal`, `uv` ) and  it is 
 * stored in a single buffer, we can specify the `data` array using the code:
 * 
 * `const data = [dat.vertices, dat.indices];` 
 * 
 * and corresponding vertex buffer array:
 * 
 * `p.vertexBuffers = [vertexBuffer, indexBuffer];`
 * 
 * @param origNumVertices The data length of the first element in the original `data` array.
 */
export const updateVertexBuffers = (device:GPUDevice, p:IPipeline, data:any[], origNumVertices:number) => {
    let len = p.vertexBuffers.length;
    if(data[0].length === origNumVertices){
        for(let i = 0; i < len; i++){
            device.queue.writeBuffer(p.vertexBuffers[i], 0, data[i]);  
        }
    } else {
        for(let i = 0; i < len; i++){
            p.vertexBuffers[i].destroy();
        }
        for(let i = 0; i < len; i++){
            p.vertexBuffers[i] = createBufferWithData(device, data[i]);
        }
    }
}

/**
 * This function can be used to create vertex, uniform, or storage GPU buffer. The default is a uniform buffer.
 * @param device GPU device
 * @param bufferSize Buffer size. 
 * @param bufferType Of the `BufferType` enum.
 */
export const createBuffer = (device:GPUDevice, bufferSize:number, bufferType = BufferType.Uniform): GPUBuffer =>  {
    let flag =  GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
    if(bufferType === BufferType.Vertex){
        flag = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
    } else if (bufferType === BufferType.Index) {
        flag = GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
    } else if (bufferType === BufferType.Storage){
        flag =  GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
    }  else if (bufferType === BufferType.VertexStorage) {
        flag = GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC;
    } else if (bufferType === BufferType.IndexStorage) {
        flag = GPUBufferUsage.INDEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC;
    }
    return device.createBuffer({
        size: bufferSize,
        usage: flag,
    });
}

/**
 * This function returns the data type of the input data.
 * @param data Can be any data type, such as Float32Array, Float64Array, Uint16Array, Uint32Array, etc.
 */
const getDataType = (data:any) => Object.prototype.toString.call(data).split(/\W/)[2]; 

/**
 * This function creats a GPU buffer with data to initialize it. If the input data is a type of `Float32Array` 
 * or `Float64Array`, it returns a vertex, uniform, or storage buffer specified by the enum `bufferType`. Otherwise,
 * if the input data has a `Uint16Array` or `Uint32Array`, this function will return an index buffer.
 * @param device GPU device
 * @param data Input data that should be one of four data types: `Float32Array`, `Float64Array`, `Uint16Array`, and 
 * `Uint32Array`
 * @param bufferType Type of enum `BufferType`. It is used to specify the type of the returned buffer. The default is
 * vertex buffer
 */
export const createBufferWithData = (device:GPUDevice, data:any, bufferType = BufferType.Vertex): GPUBuffer => {
    let flag = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
    if(bufferType === BufferType.Uniform){
        flag =  GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
    } else if (bufferType === BufferType.Storage){
        flag =  GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
    }

    let dtype = getDataType(data);
    if(dtype.includes('Uint')){
        flag = GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST;
    }    
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: flag,
        mappedAtCreation: true
    });
    if(dtype.includes('Uint32')){
        new Uint32Array(buffer.getMappedRange()).set(data);
    } else if(dtype.includes('Uint16')){
        new Uint16Array(buffer.getMappedRange()).set(data);
    } else if (dtype.includes('Float64')) {
        new Float64Array(buffer.getMappedRange()).set(data);
    } else {
        new Float32Array(buffer.getMappedRange()).set(data);
    }
    buffer.unmap();
    return buffer;
}

/**
 * This function is used to create a GPU bind group that defines a set of resources to be bound together in a 
 * group and how the resources are used in shader stages. It accepts GPU device, GPU bind group layout, uniform
 * buffer array, and the other GPU binding resource array as its input arguments. If both the buffer and other 
 * resource arrays have none zero elements, you need to place the buffer array ahead of the other resource array.
 * Make sure that the order of buffers and other resources is consistent with the `@group @binding` attributes 
 * defined in the shader code.
 * @param device GPU device
 * @param layout GPU bind group layout that defines the interface between a set of resources bound in a GPU bind
 * group and their accessibility in shader stages.
 * @param buffers The uniform buffer array
 * @param otherResources The other resource array, which can include `GPUSampler`, `GPUTextureView`, 
 * `GPUExternalTexture`, etc.
 */
export const createBindGroup = (device:GPUDevice, layout: GPUBindGroupLayout, buffers:GPUBuffer[] = [], 
otherResources:GPUBindingResource[] = []): GPUBindGroup => {
    let entries = [];
    let bufLen = buffers.length;
    let resLen = otherResources.length;
    let len = bufLen + resLen;
    for(let i = 0; i < len; i++){
        if(i < bufLen && bufLen > 0){
            entries.push(
                { 
                    binding: i,
                    resource: {
                        buffer: buffers[i],
                    }
                },
            );
        } else if (i >= bufLen && resLen > 0){
            entries.push(
                { 
                    binding: i,
                    resource: otherResources[i-bufLen],
                },
            );
        }
    }
    
    return device.createBindGroup({
        layout: layout,
        entries: entries,
    });
}

/**
 * This function is used to read data from a GPU buffer. It can be used for debugging code.
 * @param device GPU device
 * @param buffer GPU buffer
 * @param byteLength the size of the GPU buffer
 * @returns data from the GPU buffer
 */
export const readBufferData = async (device: GPUDevice, buffer: GPUBuffer, byteLength:number) => {
    const readBuffer = device.createBuffer({
        size: byteLength,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(buffer, 0, readBuffer, 0, byteLength);
    device.queue.submit([encoder.finish()]);
    await readBuffer.mapAsync(GPUMapMode.READ);     
    return readBuffer.getMappedRange();
}

// #endregion Create, Update GPU Buffers and Bind Group ***************************************


// #region Depth and MultiSample Texture ******************************************************

/**
 * This function create a GPU texture for MSAA (or sample) count = 4.
 * @param init The `IWebGPUInit` interface
 */
export const createMultiSampleTexture = (init: IWebGPUInit): GPUTexture => {
    const texture = init.device.createTexture({
        size: init.size,
        format: init.format,
        sampleCount: init.msaaCount,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    return texture;
}
    
/**
 * This function creates a GPU texture used in the depth stencil attachment in the render pass descriptor.
 * @param init The `IWebGPUInit` interface
 * @param depthFormat GPU texture format, defaulting to `'depth24plus'`
 */
export const createDepthTexture = (init: IWebGPUInit, depthFormat: GPUTextureFormat = 'depth24plus'): GPUTexture => {
    const depthTexture = init.device.createTexture({
        size: init.size,
        format : depthFormat,
        sampleCount: init.msaaCount,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    return depthTexture;
}
// #endregion Depth and MultiSample Texture Views ********************************************


// #region Transformations ********************************************************************

/** Interface as output of the `createViewTransform`. */
export interface IViewOutput {
    /** View matrix */
    viewMat?: mat4
    /** Camera options used to create a camera */
    cameraOptions: ICameraOptions,
}

/** Interface used to create a camera. */
export interface ICameraOptions {
    /** Eye or view position */
    eye?: vec3,
    /** Look at direction */
    center?: vec3,
    /** Maximum zooming range */
    zoomMax?: number,
    /** Zooming speed */
    zoomSpeed?: number,
}

/**
 * This function creates a model matrix of the `mat4` type.
 * @param translation Translation along `x` (`tx`), `y` (`ty`), and `z` (`tz`) directions, which can be specified
 * by `[tx, ty, tz]`, defaulting to [0, 0, 0]
 * @param rotation Rotation along `x` (`rx`), `y` (`ry`), and `z` (`rz`) axes, which can be specified by
 * `[rx, ry, rz]`, defaulting to [0, 0, 0]
 * @param scale Scaling along `x` (`sx`), `y` (`sy`), and `z` (`sz`) directions, which can be specified by
 * `[sx, sy, sz]`, defaulting to [1, 1, 1]
 */
export const createModelMat = (translation:vec3=[0,0,0], rotation:vec3=[0,0,0], scale:vec3=[1,1,1]): mat4 => {
    const modelMat = mat4.create();
    mat4.translate(modelMat, modelMat, translation);
    mat4.rotateX(modelMat, modelMat, rotation[0]);
    mat4.rotateY(modelMat, modelMat, rotation[1]);
    mat4.rotateZ(modelMat, modelMat, rotation[2]);
    mat4.scale(modelMat, modelMat, scale);
    return modelMat;
}

/**
 * This functions creates a view matrix of the `mat4` type and the camera options. It returns the interface
 * `IViewOutput`.
 * @param cameraPos Camera position, defaulting to [2, 2, 4]
 * @param lookDir Look at direction, defaulting to [0, 0, 0]
 * @param upDir Look up direction, defaulting to [0, 1, 0], i.e., the y direction is the look up direction
 */
export const createViewTransform = (cameraPos:vec3=[2,2,4], lookDir:vec3=[0,0,0], upDir:vec3=[0,1,0]): IViewOutput => {
    const viewMat = mat4.create();
    mat4.lookAt(viewMat, cameraPos, lookDir, upDir);
    return {
        viewMat,
        cameraOptions: {
            eye: cameraPos,
            center: lookDir,
            zoomMax: 1000,
            zoomSpeed: 2
        }
    }
};

/**
 * This function creates a projection matrix of the `mat4` type.
 * @param aspectRatio Aspect ratio, defaulting to 1
 */
export const createProjectionMat = (aspectRatio:number = 1): mat4 => {
    const projectionMat = mat4.create();       
    mat4.perspective(projectionMat, 2*Math.PI/5, aspectRatio, 0.1, 1000.0);    
    return projectionMat;
};

/**
 * This function creates a model-view-projection matrix of the `mat4` type by combining the model
 * matrix, view matrix, and projection matrix together.
 * @param modelMat Model matrix
 * @param viewMat View matrix
 * @param projectMat Projection matrix
 */
export const combineMvpMat = (modelMat:mat4, viewMat:mat4, projectionMat:mat4): mat4 => {
    const mvpMat = mat4.create();
    mat4.multiply(mvpMat, viewMat, modelMat);
    mat4.multiply(mvpMat, projectionMat, mvpMat);
    return mvpMat;
} 

/**
* This function creates a view-projection matrix of the `mat4` type by combining the 
 * view matrix and projection matrix together.
 * @param viewMat View matrix
 * @param projectMat Projection matrix
 */
export const combineVpMat = (viewMat:mat4, projectionMat:mat4): mat4 => {
    const vpMat = mat4.create();
    mat4.multiply(vpMat, projectionMat, viewMat);
    return vpMat;
} 

/**
 * This function create a normal matrix of the `mat4` type by inverting and transposing a model matrix.
 * @param modelMat Model matrix
 */
export const createNormalMat = (modelMat:mat4): mat4 => {
    const normalMat = mat4.create();
    mat4.invert(normalMat, modelMat);
    mat4.transpose(normalMat, normalMat);
    return normalMat;
}

/**
 * This function creates a camera using a `npm` package `3d-view-controls`. The returned easy to use camera
 * allows you to interact with graphics objects in the scene using mouse, such as pan, rotate, and zoom in/out 
 * the objects.
 * @param canvas HTML `canvas` element
 * @param options Camera options, type of the `ICameraOptions`
 */
export const getCamera = (canvas: HTMLCanvasElement, options: ICameraOptions) => {
    return camera(canvas, options);
}
// #endregion Transformations *****************************************************************


// #region image texture **********************************************************************

/**
 * This function creates a texture and a sampler from an image file, and returns an object that contains 
 * attributes `texture` and `sampler`.
 * @param device GPU device
 * @param imageFile the path of the image file to load
 * @param addressModeU (optional) the addressing model for the `u` texture coordinate, defaulting to `'repeat'`
 * @param addressModeV (optional) the addressing model for the `v` texture coordinate, defaulting to `'repeat'`
 */
export const createImageTexture = async(device:GPUDevice, imageFile:string, 
    addressModeU = 'repeat', addressModeV = 'repeat') => {

    // get image file
    const response = await fetch(imageFile);
    const img = await response.blob();
    const imageBitmap = await createImageBitmap(img);

    // create sampler with linear filtering for smooth interpolation 
    const sampler = device.createSampler({
        minFilter: 'linear',
        magFilter: 'linear',
        addressModeU: addressModeU as GPUAddressMode,
        addressModeV: addressModeV as GPUAddressMode
    });       

    // create texture
    const texture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | 
               GPUTextureUsage.COPY_DST | 
               GPUTextureUsage.RENDER_ATTACHMENT
    });

    device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: texture },
        [imageBitmap.width, imageBitmap.height]
    );

    return {
        texture,
        sampler
    }
}

// #endregion image texture *******************************************************************

// #region utility ****************************************************************************

/**
 * This utility function convert `hex` color string to `rgba` color array of the `Float32Array` type.
 * @param hex Hex color string
 */
export const hex2rgb = (hex:string) => {
    const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16)/255.0);
    return new Float32Array([r, g, b, 1]);
}

/**
 * This utility function creates a new `dat-gui` with a specified dom element id. This function is based on the `npm`
 * package called `dat.gui`. the `dat.gui` library is a lightweight graphical user interface for changing parameters
 * by the user.
 * @param guiDomId HTML dom element id, defaulting to `'gui'`
 */
export const getDatGui = (guiDomId = 'gui') => {
    var gui = new GUI();
    document.querySelector('#'+guiDomId).append(gui.domElement);
    return gui;
}

/**
 * This utility function creates a new `stats` panel on the scene with a specified dom element id. This function is based on
 * the `npm` package called `stats.js`. It can be used to monitor the performance of your apps, such as framerate, rendering 
 * time, and memory usage.
 * @param statsDomId 
 */
export const getStats= (statsDomId = 'stats') => {
    var stats = new Stats();
    stats.dom.style.cssText = 'position:relative;top:0;left:0';
    stats.showPanel(1);
    document.querySelector('#'+statsDomId).appendChild(stats.dom);
    return stats;
}
// #endregion utility *************************************************************************