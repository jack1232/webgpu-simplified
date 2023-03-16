"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = exports.getDatGui = exports.hex2rgb = exports.createImageTexture = exports.getCamera = exports.createNormalMat = exports.combineVpMat = exports.combineMvpMat = exports.createProjectionMat = exports.createViewTransform = exports.createModelMat = exports.createDepthTexture = exports.createMultiSampleTexture = exports.readBufferData = exports.createBindGroup = exports.createBufferWithData = exports.createBuffer = exports.updateVertexBuffers = exports.BufferType = exports.createRenderPassDescriptor = exports.setVertexBuffers = exports.createComputePipelineDescriptor = exports.createRenderPipelineDescriptor = exports.checkWebGPUSupport = exports.initWebGPU = void 0;
var gl_matrix_1 = require("gl-matrix");
var camera = require('3d-view-controls');
var Stats = require("stats.js");
var dat_gui_1 = require("dat.gui");
/**
 * This function is used to initialize the WebGPU apps. It returns the IWebGPUInit interface.
 *
 * @param input - The input argument of the `IWebGPUInitInput` interface type with default members:
 *
 * `input.format = navigator.gpu.getPreferredCanvasFormat()`
 *
 * `input.msaa.Count = 1`
 */
var initWebGPU = function (input) { return __awaiter(void 0, void 0, void 0, function () {
    var adapter, device, context, pixelRatio, size, background;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                // set default parameters
                input.format = input.format === undefined ? navigator.gpu.getPreferredCanvasFormat() : input.format;
                input.msaaCount = input.msaaCount === undefined ? 1 : input.msaaCount;
                if (exports.checkWebGPUSupport.includes('does not support WebGPU')) {
                    throw (exports.checkWebGPUSupport);
                }
                return [4 /*yield*/, navigator.gpu.requestAdapter()];
            case 1:
                adapter = _a.sent();
                return [4 /*yield*/, adapter.requestDevice()];
            case 2:
                device = _a.sent();
                context = input.canvas.getContext('webgpu');
                pixelRatio = window.devicePixelRatio || 1;
                input.canvas.width = input.canvas.clientWidth * pixelRatio;
                input.canvas.height = input.canvas.clientHeight * pixelRatio;
                size = { width: input.canvas.width, height: input.canvas.height };
                context.configure({
                    device: device,
                    format: input.format,
                    alphaMode: 'opaque',
                    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
                });
                background = { r: 0.009, g: 0.0125, b: 0.0164, a: 1.0 };
                return [2 /*return*/, { device: device, context: context, format: input.format, size: size, background: background, msaaCount: input.msaaCount }];
        }
    });
}); };
exports.initWebGPU = initWebGPU;
/** A string variable used to check whether your browser supports WebGPU or not.*/
exports.checkWebGPUSupport = navigator.gpu ? 'Great, your current browser supports WebGPU!' :
    "Your current browser does not support WebGPU! Make sure you are on a system \n    with WebGPU enabled.";
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
var createRenderPipelineDescriptor = function (input, withFragment) {
    if (withFragment === void 0) { withFragment = true; }
    input.primitiveType = input.primitiveType === undefined ? 'triangle-list' : input.primitiveType;
    input.cullMode = input.cullMode === undefined ? 'none' : input.cullMode;
    input.isDepthStencil = input.isDepthStencil === undefined ? true : input.isDepthStencil;
    input.vsEntry = input.vsEntry === undefined ? 'vs_main' : input.vsEntry;
    input.fsEntry = input.fsEntry === undefined ? 'fs_main' : input.fsEntry;
    if (input.shader) {
        input.vsShader = input.shader;
        input.fsShader = input.shader;
    }
    input.indexFormat = input.indexFormat === undefined ? 'uint32' : input.indexFormat;
    var indexFormat = undefined;
    if (input.primitiveType.includes('strip')) {
        indexFormat = input.indexFormat;
    }
    var descriptor = {
        layout: 'auto',
        vertex: {
            module: input.init.device.createShaderModule({
                code: input.vsShader,
            }),
            entryPoint: input.vsEntry,
            buffers: input.buffers,
        },
        fragment: withFragment ? {
            module: input.init.device.createShaderModule({
                code: input.fsShader,
            }),
            entryPoint: input.fsEntry,
            targets: [
                {
                    format: input.init.format
                }
            ],
        } : undefined,
        primitive: {
            topology: input.primitiveType,
            stripIndexFormat: indexFormat,
            cullMode: input.cullMode,
        },
        multisample: {
            count: input.init.msaaCount,
        }
    };
    if (input.isDepthStencil) {
        descriptor.depthStencil = {
            format: "depth24plus",
            depthWriteEnabled: true,
            depthCompare: "less"
        };
    }
    return descriptor;
};
exports.createRenderPipelineDescriptor = createRenderPipelineDescriptor;
/**
 * This function create a compute pipeline descriptor that will be used to create a compute pipeline.
 * @param device GPU Device
 * @param csShader the WGSL compute shader
 * @param entry the entry point for teh compute shader
 * @returns the compute pipeline descriptor.
 */
var createComputePipelineDescriptor = function (device, csShader, entry) {
    if (entry === void 0) { entry = 'cs_main'; }
    return {
        layout: 'auto',
        compute: {
            module: device.createShaderModule({
                code: csShader,
            }),
            entryPoint: 'cs_main',
        }
    };
};
exports.createComputePipelineDescriptor = createComputePipelineDescriptor;
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
var setVertexBuffers = function (formats, offsets, totalArrayStride, shaderLocations) {
    if (offsets === void 0) { offsets = []; }
    if (totalArrayStride === void 0) { totalArrayStride = 0; }
    if (shaderLocations === void 0) { shaderLocations = []; }
    var len = formats.length;
    var len1 = offsets.length;
    var len2 = shaderLocations.length;
    var buffers = [];
    if (len1 === 0) {
        for (var i = 0; i < len; i++) {
            var stride = 4 * parseInt(formats[i].split('x')[1]);
            var loc = len2 === 0 ? i : shaderLocations[i];
            buffers.push({
                arrayStride: stride,
                attributes: [{
                        shaderLocation: loc,
                        format: formats[i],
                        offset: 0,
                    }]
            });
        }
    }
    else {
        var attributes = [];
        var strides = 0;
        for (var i = 0; i < len1; i++) {
            strides += 4 * parseInt(formats[i].split('x')[1]);
            var loc = len2 === 0 ? i : shaderLocations[i];
            attributes.push({
                shaderLocation: loc,
                format: formats[i],
                offset: offsets[i],
            });
        }
        if (totalArrayStride > 0) {
            strides = totalArrayStride;
        }
        buffers = [{
                arrayStride: totalArrayStride,
                attributes: attributes
            }];
    }
    return buffers;
};
exports.setVertexBuffers = setVertexBuffers;
/**
 * This function creates the render pass descriptor that will be used to create a render pass with various options.
 * The returned desciptor will include a depth-stencil attachment if the depth texture view is provided via the input
 * interface `IRenderPassInput`. Otherwise, the depth stencil attachment will not be defined. The argument
 * `withColorAttachment` indicates whether the descriptor should contain color attachments or not. In addition, you can
 * specify the MSAA count parameter.
 * @param input The type of interface `IRenderPassInput`
 * @param withColorAttachment Indicates whether the descriptor should contain color attachments or not
 */
var createRenderPassDescriptor = function (input, withColorAttachment) {
    if (withColorAttachment === void 0) { withColorAttachment = true; }
    var colorAttachmentView = input.init.msaaCount > 1 ? input.textureView :
        input.init.context.getCurrentTexture().createView();
    var colorAttachmentResolveTarget = input.init.msaaCount > 1 ?
        input.init.context.getCurrentTexture().createView() : undefined;
    var descriptor = {
        colorAttachments: withColorAttachment ? [{
                view: colorAttachmentView,
                resolveTarget: colorAttachmentResolveTarget,
                clearValue: input.init.background,
                loadOp: 'clear',
                storeOp: 'store'
            }] : [],
        depthStencilAttachment: input.depthView ? {
            view: input.depthView,
            depthClearValue: 1.0,
            depthLoadOp: "clear",
            depthStoreOp: "store",
        } : undefined,
    };
    return descriptor;
};
exports.createRenderPassDescriptor = createRenderPassDescriptor;
// #endregion Render pass descriptor **********************************************************
// #region Create, Update GPU Buffers and Bind Group ******************************************
/** The enumeration for specifying the type of a GPU buffer. */
var BufferType;
(function (BufferType) {
    /** Uniform buffer */
    BufferType[BufferType["Uniform"] = 0] = "Uniform";
    /** Vertex buffer */
    BufferType[BufferType["Vertex"] = 1] = "Vertex";
    /** Index buffer */
    BufferType[BufferType["Index"] = 2] = "Index";
    /** Storage buffer */
    BufferType[BufferType["Storage"] = 3] = "Storage";
    /** vertex-Storage buffer */
    BufferType[BufferType["VertexStorage"] = 4] = "VertexStorage";
    /** Index-Storage buffer */
    BufferType[BufferType["IndexStorage"] = 5] = "IndexStorage";
})(BufferType = exports.BufferType || (exports.BufferType = {}));
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
var updateVertexBuffers = function (device, p, data, origNumVertices) {
    var len = p.vertexBuffers.length;
    if (data[0].length === origNumVertices) {
        for (var i = 0; i < len; i++) {
            device.queue.writeBuffer(p.vertexBuffers[i], 0, data[i]);
        }
    }
    else {
        for (var i = 0; i < len; i++) {
            p.vertexBuffers[i].destroy();
        }
        for (var i = 0; i < len; i++) {
            p.vertexBuffers[i] = (0, exports.createBufferWithData)(device, data[i]);
        }
    }
};
exports.updateVertexBuffers = updateVertexBuffers;
/**
 * This function can be used to create vertex, uniform, or storage GPU buffer. The default is a uniform buffer.
 * @param device GPU device
 * @param bufferSize Buffer size.
 * @param bufferType Of the `BufferType` enum.
 */
var createBuffer = function (device, bufferSize, bufferType) {
    if (bufferType === void 0) { bufferType = BufferType.Uniform; }
    var flag = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
    if (bufferType === BufferType.Vertex) {
        flag = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
    }
    else if (bufferType === BufferType.Index) {
        flag = GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
    }
    else if (bufferType === BufferType.Storage) {
        flag = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
    }
    else if (bufferType === BufferType.VertexStorage) {
        flag = GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC;
    }
    else if (bufferType === BufferType.IndexStorage) {
        flag = GPUBufferUsage.INDEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC;
    }
    return device.createBuffer({
        size: bufferSize,
        usage: flag,
    });
};
exports.createBuffer = createBuffer;
/**
 * This function returns the data type of the input data.
 * @param data Can be any data type, such as Float32Array, Float64Array, Uint16Array, Uint32Array, etc.
 */
var getDataType = function (data) { return Object.prototype.toString.call(data).split(/\W/)[2]; };
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
var createBufferWithData = function (device, data, bufferType) {
    if (bufferType === void 0) { bufferType = BufferType.Vertex; }
    var flag = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
    if (bufferType === BufferType.Uniform) {
        flag = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
    }
    else if (bufferType === BufferType.Storage) {
        flag = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
    }
    var dtype = getDataType(data);
    if (dtype.includes('Uint')) {
        flag = GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST;
    }
    var buffer = device.createBuffer({
        size: data.byteLength,
        usage: flag,
        mappedAtCreation: true
    });
    if (dtype.includes('Uint32')) {
        new Uint32Array(buffer.getMappedRange()).set(data);
    }
    else if (dtype.includes('Uint16')) {
        new Uint16Array(buffer.getMappedRange()).set(data);
    }
    else if (dtype.includes('Float64')) {
        new Float64Array(buffer.getMappedRange()).set(data);
    }
    else {
        new Float32Array(buffer.getMappedRange()).set(data);
    }
    buffer.unmap();
    return buffer;
};
exports.createBufferWithData = createBufferWithData;
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
var createBindGroup = function (device, layout, buffers, otherResources) {
    if (buffers === void 0) { buffers = []; }
    if (otherResources === void 0) { otherResources = []; }
    var entries = [];
    var bufLen = buffers.length;
    var resLen = otherResources.length;
    var len = bufLen + resLen;
    for (var i = 0; i < len; i++) {
        if (i < bufLen && bufLen > 0) {
            entries.push({
                binding: i,
                resource: {
                    buffer: buffers[i],
                }
            });
        }
        else if (i >= bufLen && resLen > 0) {
            entries.push({
                binding: i,
                resource: otherResources[i - bufLen],
            });
        }
    }
    return device.createBindGroup({
        layout: layout,
        entries: entries,
    });
};
exports.createBindGroup = createBindGroup;
/**
 * This function is used to read data from a GPU buffer. It can be used for debugging code.
 * @param device GPU device
 * @param buffer GPU buffer
 * @param byteLength the size of the GPU buffer
 * @returns data from the GPU buffer
 */
var readBufferData = function (device, buffer, byteLength) { return __awaiter(void 0, void 0, void 0, function () {
    var readBuffer, encoder, readData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                readBuffer = device.createBuffer({
                    size: byteLength,
                    usage: GPUBufferUsage.MAP_READ,
                });
                encoder = device.createCommandEncoder();
                encoder.copyBufferToBuffer(buffer, 0, readBuffer, 0, byteLength);
                device.queue.submit([encoder.finish()]);
                return [4 /*yield*/, readBuffer.mapAsync(GPUMapMode.READ)];
            case 1:
                readData = _a.sent();
                return [2 /*return*/, readData];
        }
    });
}); };
exports.readBufferData = readBufferData;
// #endregion Create, Update GPU Buffers and Bind Group ***************************************
// #region Depth and MultiSample Texture ******************************************************
/**
 * This function create a GPU texture for MSAA (or sample) count = 4.
 * @param init The `IWebGPUInit` interface
 */
var createMultiSampleTexture = function (init) {
    var texture = init.device.createTexture({
        size: init.size,
        format: init.format,
        sampleCount: init.msaaCount,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    return texture;
};
exports.createMultiSampleTexture = createMultiSampleTexture;
/**
 * This function creates a GPU texture used in the depth stencil attachment in the render pass descriptor.
 * @param init The `IWebGPUInit` interface
 * @param depthFormat GPU texture format, defaulting to `'depth24plus'`
 */
var createDepthTexture = function (init, depthFormat) {
    if (depthFormat === void 0) { depthFormat = 'depth24plus'; }
    var depthTexture = init.device.createTexture({
        size: init.size,
        format: depthFormat,
        sampleCount: init.msaaCount,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    return depthTexture;
};
exports.createDepthTexture = createDepthTexture;
/**
 * This function creates a model matrix of the `mat4` type.
 * @param translation Translation along `x` (`tx`), `y` (`ty`), and `z` (`tz`) directions, which can be specified
 * by `[tx, ty, tz]`, defaulting to [0, 0, 0]
 * @param rotation Rotation along `x` (`rx`), `y` (`ry`), and `z` (`rz`) axes, which can be specified by
 * `[rx, ry, rz]`, defaulting to [0, 0, 0]
 * @param scale Scaling along `x` (`sx`), `y` (`sy`), and `z` (`sz`) directions, which can be specified by
 * `[sx, sy, sz]`, defaulting to [1, 1, 1]
 */
var createModelMat = function (translation, rotation, scale) {
    if (translation === void 0) { translation = [0, 0, 0]; }
    if (rotation === void 0) { rotation = [0, 0, 0]; }
    if (scale === void 0) { scale = [1, 1, 1]; }
    var modelMat = gl_matrix_1.mat4.create();
    gl_matrix_1.mat4.translate(modelMat, modelMat, translation);
    gl_matrix_1.mat4.rotateX(modelMat, modelMat, rotation[0]);
    gl_matrix_1.mat4.rotateY(modelMat, modelMat, rotation[1]);
    gl_matrix_1.mat4.rotateZ(modelMat, modelMat, rotation[2]);
    gl_matrix_1.mat4.scale(modelMat, modelMat, scale);
    return modelMat;
};
exports.createModelMat = createModelMat;
/**
 * This functions creates a view matrix of the `mat4` type and the camera options. It returns the interface
 * `IViewOutput`.
 * @param cameraPos Camera position, defaulting to [2, 2, 4]
 * @param lookDir Look at direction, defaulting to [0, 0, 0]
 * @param upDir Look up direction, defaulting to [0, 1, 0], i.e., the y direction is the look up direction
 */
var createViewTransform = function (cameraPos, lookDir, upDir) {
    if (cameraPos === void 0) { cameraPos = [2, 2, 4]; }
    if (lookDir === void 0) { lookDir = [0, 0, 0]; }
    if (upDir === void 0) { upDir = [0, 1, 0]; }
    var viewMat = gl_matrix_1.mat4.create();
    gl_matrix_1.mat4.lookAt(viewMat, cameraPos, lookDir, upDir);
    return {
        viewMat: viewMat,
        cameraOptions: {
            eye: cameraPos,
            center: lookDir,
            zoomMax: 1000,
            zoomSpeed: 2
        }
    };
};
exports.createViewTransform = createViewTransform;
/**
 * This function creates a projection matrix of the `mat4` type.
 * @param aspectRatio Aspect ratio, defaulting to 1
 */
var createProjectionMat = function (aspectRatio) {
    if (aspectRatio === void 0) { aspectRatio = 1; }
    var projectionMat = gl_matrix_1.mat4.create();
    gl_matrix_1.mat4.perspective(projectionMat, 2 * Math.PI / 5, aspectRatio, 0.1, 1000.0);
    return projectionMat;
};
exports.createProjectionMat = createProjectionMat;
/**
 * This function creates a model-view-projection matrix of the `mat4` type by combining the model
 * matrix, view matrix, and projection matrix together.
 * @param modelMat Model matrix
 * @param viewMat View matrix
 * @param projectMat Projection matrix
 */
var combineMvpMat = function (modelMat, viewMat, projectionMat) {
    var mvpMat = gl_matrix_1.mat4.create();
    gl_matrix_1.mat4.multiply(mvpMat, viewMat, modelMat);
    gl_matrix_1.mat4.multiply(mvpMat, projectionMat, mvpMat);
    return mvpMat;
};
exports.combineMvpMat = combineMvpMat;
/**
* This function creates a view-projection matrix of the `mat4` type by combining the
 * view matrix and projection matrix together.
 * @param viewMat View matrix
 * @param projectMat Projection matrix
 */
var combineVpMat = function (viewMat, projectionMat) {
    var vpMat = gl_matrix_1.mat4.create();
    gl_matrix_1.mat4.multiply(vpMat, projectionMat, viewMat);
    return vpMat;
};
exports.combineVpMat = combineVpMat;
/**
 * This function create a normal matrix of the `mat4` type by inverting and transposing a model matrix.
 * @param modelMat Model matrix
 */
var createNormalMat = function (modelMat) {
    var normalMat = gl_matrix_1.mat4.create();
    gl_matrix_1.mat4.invert(normalMat, modelMat);
    gl_matrix_1.mat4.transpose(normalMat, normalMat);
    return normalMat;
};
exports.createNormalMat = createNormalMat;
/**
 * This function creates a camera using a `npm` package `3d-view-controls`. The returned easy to use camera
 * allows you to interact with graphics objects in the scene using mouse, such as pan, rotate, and zoom in/out
 * the objects.
 * @param canvas HTML `canvas` element
 * @param options Camera options, type of the `ICameraOptions`
 */
var getCamera = function (canvas, options) {
    return camera(canvas, options);
};
exports.getCamera = getCamera;
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
var createImageTexture = function (device, imageFile, addressModeU, addressModeV) {
    if (addressModeU === void 0) { addressModeU = 'repeat'; }
    if (addressModeV === void 0) { addressModeV = 'repeat'; }
    return __awaiter(void 0, void 0, void 0, function () {
        var response, img, imageBitmap, sampler, texture;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch(imageFile)];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.blob()];
                case 2:
                    img = _a.sent();
                    return [4 /*yield*/, createImageBitmap(img)];
                case 3:
                    imageBitmap = _a.sent();
                    sampler = device.createSampler({
                        minFilter: 'linear',
                        magFilter: 'linear',
                        addressModeU: addressModeU,
                        addressModeV: addressModeV
                    });
                    texture = device.createTexture({
                        size: [imageBitmap.width, imageBitmap.height, 1],
                        format: 'rgba8unorm',
                        usage: GPUTextureUsage.TEXTURE_BINDING |
                            GPUTextureUsage.COPY_DST |
                            GPUTextureUsage.RENDER_ATTACHMENT
                    });
                    device.queue.copyExternalImageToTexture({ source: imageBitmap }, { texture: texture }, [imageBitmap.width, imageBitmap.height]);
                    return [2 /*return*/, {
                            texture: texture,
                            sampler: sampler
                        }];
            }
        });
    });
};
exports.createImageTexture = createImageTexture;
// #endregion image texture *******************************************************************
// #region utility ****************************************************************************
/**
 * This utility function convert `hex` color string to `rgba` color array of the `Float32Array` type.
 * @param hex Hex color string
 */
var hex2rgb = function (hex) {
    var _a = hex.match(/\w\w/g).map(function (x) { return parseInt(x, 16) / 255.0; }), r = _a[0], g = _a[1], b = _a[2];
    return new Float32Array([r, g, b, 1]);
};
exports.hex2rgb = hex2rgb;
/**
 * This utility function creates a new `dat-gui` with a specified dom element id. This function is based on the `npm`
 * package called `dat.gui`. the `dat.gui` library is a lightweight graphical user interface for changing parameters
 * by the user.
 * @param guiDomId HTML dom element id, defaulting to `'gui'`
 */
var getDatGui = function (guiDomId) {
    if (guiDomId === void 0) { guiDomId = 'gui'; }
    var gui = new dat_gui_1.GUI();
    document.querySelector('#' + guiDomId).append(gui.domElement);
    return gui;
};
exports.getDatGui = getDatGui;
/**
 * This utility function creates a new `stats` panel on the scene with a specified dom element id. This function is based on
 * the `npm` package called `stats.js`. It can be used to monitor the performance of your apps, such as framerate, rendering
 * time, and memory usage.
 * @param statsDomId
 */
var getStats = function (statsDomId) {
    if (statsDomId === void 0) { statsDomId = 'stats'; }
    var stats = new Stats();
    stats.dom.style.cssText = 'position:relative;top:0;left:0';
    stats.showPanel(1);
    document.querySelector('#' + statsDomId).appendChild(stats.dom);
    return stats;
};
exports.getStats = getStats;
// #endregion utility *************************************************************************
