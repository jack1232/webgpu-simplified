import { vec3, mat4 } from 'gl-matrix';
const camera = require('3d-view-controls');
import * as Stats from 'stats.js';
import { GUI } from 'dat.gui';

// #region WebGPU initialization **************************************************************
export interface IWebGPUInit {
    device?: GPUDevice;
    context?: GPUCanvasContext;
    format?: GPUTextureFormat;
    size?: {width: number, height: number};
    background?: {r: number, g: number, b: number, a: number};
}

export const initWebGPU = async (canvas: HTMLCanvasElement, 
    format: GPUTextureFormat = navigator.gpu.getPreferredCanvasFormat()): Promise<IWebGPUInit> => {

    if(checkWebGPUSupport.includes('does not support WebGPU')){
        throw(checkWebGPUSupport);
    }
    
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu') as GPUCanvasContext;
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * pixelRatio;
    canvas.height = canvas.clientHeight * pixelRatio;
    const size = {width: canvas.width, height: canvas.height};
    context.configure({
        device: device,
        format: format,
        alphaMode: 'opaque',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
    });
    const background = { r: 0.009, g: 0.0125, b: 0.0164, a: 1.0 };
    return {device, context, format, size, background};    
}

export const checkWebGPUSupport = navigator.gpu? 'Great, your current browser supports WebGPU!' : 
    `Your current browser does not support WebGPU! Make sure you are on a system 
    with WebGPU enabled.`;

// #endregion WebGPU initialization ***********************************************************


// #region Render Pipeline Descriptor *********************************************************
export interface IPipeline {
    pipelines?: GPURenderPipeline[],
    csPipelines?: GPUComputePipeline[],
    gpuTextures?: GPUTexture[],
    depthTextures?: GPUTexture[],
    vertexBuffers?: GPUBuffer[],
    uniformBuffers?: GPUBuffer[],
    uniformBindGroups?: GPUBindGroup[],
    numVertices?: number,
    numInstances?: number,
    msaaCount?: number,
}

export interface IRenderPipelineInput {
    device: GPUDevice,
    format?: GPUTextureFormat, 
    primitiveType?: GPUPrimitiveTopology,
    indexFormat?: GPUIndexFormat,
    cullMode?: GPUCullMode,
    msaaCount?: number,
    isDepthStencil?: boolean,
    buffers?: Iterable<GPUVertexBufferLayout>,
    shader?: string,
    vsShader?: string,
    fsShader?: string,
    vsEntry?: string,
    fsEntry?: string,
}

export const createRenderPipelineDescriptor = (input: IRenderPipelineInput, withFragment = true): GPURenderPipelineDescriptor => {
    input.primitiveType = input.primitiveType === undefined? 'triangle-list': input.primitiveType;
    input.cullMode = input.cullMode === undefined? 'none': input.cullMode;
    input.isDepthStencil = input.isDepthStencil === undefined? true: input.isDepthStencil;
    input.vsEntry = input.vsEntry === undefined? 'vs_main': input.vsEntry;
    input.fsEntry = input.fsEntry === undefined? 'fs_main': input.fsEntry;
    input.msaaCount = input.msaaCount === undefined? 1: input.msaaCount;
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
            module: input.device.createShaderModule({                    
                code: input.vsShader,
            }),
            entryPoint: input.vsEntry,
            buffers: input.buffers,
        },
        fragment: withFragment? {
            module: input.device.createShaderModule({                    
                code: input.fsShader,
            }),
            entryPoint: input.fsEntry,
            targets: [
                {
                    format: input.format
                }
            ],
        }: undefined,
        primitive:{
            topology: input.primitiveType,
            stripIndexFormat: indexFormat,
            cullMode: input.cullMode,
        },
        multisample: {
            count: input.msaaCount,
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
        //let strides = 0;
        for(let i = 0; i < len1; i++){
            //strides += 4 * parseInt(formats[i].split('x')[1]);
            let loc = len2 === 0? i: shaderLocations[i];
            attributes.push({
                shaderLocation: loc,
                format: formats[i],
                offset: offsets[i],
            });
        }
        buffers = [{
            arrayStride: totalArrayStride,
            attributes: attributes as Iterable<GPUVertexAttribute>
        }];
    }
    return buffers; 
}
// #endregion Render Pipeline Descriptor ******************************************************


// #region Render pass descriptor *************************************************************
export interface IRenderPassInput {
    IWebGPUInit?: IWebGPUInit,
    textureView?: GPUTextureView,
    depthView?: GPUTextureView,
    msaaCount?: number
}

export const createRenderPassDescriptor = (input: IRenderPassInput, withColorAttachment = true): GPURenderPassDescriptor => {
    input.msaaCount = input.msaaCount === undefined? 1: input.msaaCount;
    
    const colorAttachmentView = input.msaaCount > 1? input.textureView: 
        input.IWebGPUInit.context.getCurrentTexture().createView();
    const colorAttachmentResolveTarget = input.msaaCount>1?
        input.IWebGPUInit.context.getCurrentTexture().createView(): undefined;

    const descriptor: GPURenderPassDescriptor = {
        colorAttachments: withColorAttachment? [{
            view: colorAttachmentView,
            resolveTarget: colorAttachmentResolveTarget,
            clearValue: input.IWebGPUInit.background,
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
export enum BufferType {
    Uniform,
    Vertex,
    Storage,
}

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


export const createBuffer = (device:GPUDevice, bufferSize:number, bufferType = BufferType.Uniform): GPUBuffer =>  {
    let flag =  GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
    if(bufferType === BufferType.Vertex){
        flag = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
    } else if (bufferType === BufferType.Storage){
        flag =  GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
    } 

    return device.createBuffer({
        size: bufferSize,
        usage: flag,
    });
}

const getDataType = (d:any) => Object.prototype.toString.call(d).split(/\W/)[2]; 

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
// #endregion Create, Update GPU Buffers and Bind Group ***************************************


// #region Depth and MultiSample Texture ******************************************************
export const createMultiSampleTexture = (device: GPUDevice, size: GPUExtent3DStrict, 
format: GPUTextureFormat): GPUTexture => {
    const texture = device.createTexture({
        size,
        format: format,
        sampleCount: 4,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    return texture;
}
    
export const createDepthTexture = (device: GPUDevice, size: GPUExtent3DStrict, 
msaaCount:number = 1, format: GPUTextureFormat = 'depth24plus'): GPUTexture => {
    const depthTexture = device.createTexture({
        size,
        format,
        sampleCount: msaaCount,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    return depthTexture;
}
// #endregion Depth and MultiSample Texture Views ********************************************


// #region Transformations ********************************************************************
export interface IViewOutput {
    viewMat?: mat4
    cameraOptions: ICameraOptions,
}

export interface ICameraOptions {
    eye?: vec3,
    center?: vec3,
    zoomMax?: number,
    zoomSpeed?: number,
}

export const createModelMat = (translation:vec3=[0,0,0], rotation:vec3=[0,0,0], scale:vec3=[1,1,1]): mat4 => {
    const modelMat = mat4.create();
    mat4.translate(modelMat, modelMat, translation);
    mat4.rotateX(modelMat, modelMat, rotation[0]);
    mat4.rotateY(modelMat, modelMat, rotation[1]);
    mat4.rotateZ(modelMat, modelMat, rotation[2]);
    mat4.scale(modelMat, modelMat, scale);
    return modelMat;
}

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

export const createProjectionMat = (aspectRatio:number = 1): mat4 => {
    const projectionMat = mat4.create();       
    mat4.perspective(projectionMat, 2*Math.PI/5, aspectRatio, 0.1, 1000.0);    
    return projectionMat;
};

export const combineMvpMat = (modelMat:mat4, viewMat:mat4, projectMat:mat4): mat4 => {
    const mvpMat = mat4.create();
    mat4.multiply(mvpMat, viewMat, modelMat);
    mat4.multiply(mvpMat, projectMat, mvpMat);
    return mvpMat;
} 

export const combineVpMat = (viewMat:mat4, projectMat:mat4): mat4 => {
    const vpMat = mat4.create();
    mat4.multiply(vpMat, projectMat, viewMat);
    return vpMat;
} 

export const createNormalMat = (modelMat:mat4): mat4 => {
    const normalMat = mat4.create();
    mat4.invert(normalMat, modelMat);
    mat4.transpose(normalMat, normalMat);
    return normalMat;
}

export const getCamera = (canvas: HTMLCanvasElement, options: ICameraOptions) => {
    return camera(canvas, options);
}
// #endregion Transformations *****************************************************************


// #region utility ****************************************************************************
export const hex2rgb = (hex:string) => {
    const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16)/255.0);
    return new Float32Array([r, g, b, 1]);
}

export const getDatGui = (guiDomId = 'gui') => {
    var gui = new GUI();
    document.querySelector('#'+guiDomId).append(gui.domElement);
    return gui;
}

export const getStats= (statsDomId = 'stats') => {
    var stats = new Stats();
    stats.dom.style.cssText = 'position:relative;top:0;left:0';
    stats.showPanel(1);
    document.querySelector('#'+statsDomId).appendChild(stats.dom);
    return stats;
}
// #endregion utility *************************************************************************