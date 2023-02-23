WebGPU is a work-in-progress graphics API and future web standard for graphics and compute. The intension of this `webgpu-simplified` package is to simplify the process of building WebGPU apps. It is a side project that has come out of the examples included in my soon-to-be-published book [**"Advanced GPU Graphics with WebGPU"**](https://drxudotnet.com). It is not a renderer nor a render engine, but simply  a collection of helper functions and interfaces. Unlike a render engine, this mini librray does not alter the code structure and workflow of the original WebGPU applications. 

The helper functions contained in this package can help you build WebGPU apps quickly and avoid code deplication in creating GPU buffers, render/compute pipelines, render pass, and 3D transformations. This mini library does not do it all, and if you want add more features to it, you can do it by pulling the GitHub repo. In some cases where a particular feature may not be implemented in the package, you can always write the standard WebGPU code for it, which is much more flexible than a render engine. 


# Usage

Install the library by running

```
npm install webgpu-simplified
```
You can import all functions and interfaces

```
import * as ws from "webgpu-simplified"
```
or just import the bits you need

```
import { 
    createRenderPipelineDescriptor,
    createBufferWithData,
    createBindGroup,
    ...
} from "webgpu-simplified"
```

# Descriptions about Functions

The detailed explanation about the functions included in the package can be found 
[here](https://jack1232.github.io/webgpu-simplified/). 

# Examples

## Simplify render-pipeline-descriptor creation

Supporse we have the following render pipeline descriptor written in standard WebGPU code:

```
const descriptor = {
    layout: 'auto',
    vertex: {
        module: device.createShaderModule({                    
            code: shader
        }),
        entryPoint: "vs_main",
        buffers:[
            {
                arrayStride: 12,  // position
                attributes: [{
                    shaderLocation: 0,
                    format: "float32x3",
                    offset: 0
                }]
            },
            {
                arrayStride: 12,  // normal
                attributes: [{
                    shaderLocation: 1,
                    format: "float32x3",
                    offset: 0
                }]
            },
            {
                arrayStride: 8,   // uv
                attributes: [{
                    shaderLocation: 2,
                    format: "float32x2",
                    offset: 0
                }]
            }
        ]
    },
    fragment: {
        module: device.createShaderModule({                    
            code: shader
        }),
        entryPoint: "fs_main",
        targets: [
            {
                format: navigator.gpu.getPreferredCanvasFormat()
            }
        ]
    },
    primitive:{
        topology: "triangle-list",
    },
    depthStencil:{
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less"
    }
}
```
The `buffers` attribute in the `vertex` stage contains `position`, `normal`, and `uv` data at the `shaderLocation` 0, 1, and 2 respectively. We can simplify this code using `webgpu-simplified` with the following code:

```
import * as ws from "webgpu-simplified";

let bufs = ws.setVertexBuffers(['float32x3', 'float32x3', 'float32x2]);
const descriptor = ws.createRenderPipelineDescriptor({
    device, shader,
    format: navigator.gpu.getPreferredCanvasFormat()
    buffers: bufs,
});

```
This greatly simplifies the original WebGPU code for creating the same render pipeline descriptor.

## Simplify render-pass-descriptor creation

Suppose we have the following render pass descriptor written in the standard WebGPU code:

```
const descriptor = {
    colorAttachments: [{
        view: gpuTexture.createView(),
        resolveTarget: msaaTexture.createView(),
        clearValue: { r: 0.2, g: 0.247, b: 0.314, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store'
    }],
    depthStencilAttachment: {
        view: depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: "store",
    }
};
```
This code is used in the cases where MSAA sample count = 4.

We can simplify this code using `webgpu-simplified` with the following code:

```
const descriptor = ws.createRenderPassDescriptor({
    IWebGPUInit,
    depthView: depthTexture.createView(),
    textureView: gpuTexture.createView(),
    msaaCount: 4,
});
```
## Simplify bind-group creation

Here is the standard WebGPU code for creating a uniform bind group:

```
const uniformBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
        {
            binding: 0,
            resource: {
                buffer: vertexUniformBuffer,
                offset: 0,
                size: 192
            }
        },
        {
            binding: 1,
            resource: {
                buffer: fragmentUniformBuffer,
                offset: 0,
                size: 32
            }
        },
        {
            binding: 2,
            resource: {
                buffer: lightUniformBuffer,
                offset: 0,
                size: 48
            }
        }   
        {
            binding: 3,
            resource: ts.sampler
        },
        {
            binding: 4,
            resource: ts.texture.createView()
        }                                   
    ]
});
```
We can simplify this code using `webgpu-simplified` with the following code:

```
import * as ws from "webgpu-simplified";

const uniformBuffers = [vertexUniformBuffer, fragmentUniformBuffer, lightUniformBuffer];
const otherBindingResources = [ts.sampler, ts.texture.createView()];

const uniformBindGroup = ws.createBindGroup(device, pipeline.getBindGroupLayout(0), 
    uniformBuffers, otherBindingResources);
```

## Update vertex buffers

If varying some parameters causes changes in the vertex data and GPU buffer size (e.g. changing the radius and u-v segments in a UV sphere example), we need to update the vertex buffers. Here is the standard WebGPU code for doing it:

```
const updateBuffers = (origNumVertices:number) => {
    if(posData.length === origNumVertices){
        // buffer size not changed, we can write new data to original buffers:
        device.queue.writeBuffer(posBuffer, 0, posData);
        device.queue.writeBuffer(normalBuffer, 0, normalData);
        device.queue.writeBuffer(uvBuffer, 0, uvData);
        device.queue.writeBuffer(indexBuffer, 0, indexData);
    } else {
        // buffer size changed, we must recreate buffers with new data:
        posBuffer.destroy();
        normalBuffer.destroy();
        uvBuffer.destroy();
        indexBuffer.destroy();

        posBuffer = device.createBuffer({
            size: posData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        normalBuffer = device.createBuffer({
            size: normalData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        uvBuffer = device.createBuffer({
            size: uvData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        indexBuffer = device.createBuffer({
            size: indexData.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(posBuffer, 0, posData);
        device.queue.writeBuffer(normalBuffer, 0, normalData);
        device.queue.writeBuffer(uvBuffer, 0, uvData);
        device.queue.writeBuffer(indexBuffer, 0, indexData);
    }
}
```
We can simplify this code using `webgpu-simplified` with the following code:

```
import * as ws from 'webgpu-simplified';

const updateBuffers = (origNumVertices:number) => {
    const data = [posData, normalData, uvData, indexData];
    ws.updateVertexBuffers(device, pipeline, data, origNumVertices);
}
```

## Create GPU buffers with data 
We can create a buffer with data initialize it using the following standard WebGPU code:

```
// create a vertex buffer
const createVertexBuffer = (data: Float32Array):GPUBuffer => {
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
    });
    new Float32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();
    return buffer;
}

// create an index buffer
const createIndexBuffer = (data: Uint32Array):GPUBuffer => {
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
    });
    new Uint32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();
    return buffer;
}

// create a uniform buffer
const createUniformBuffer = (data: Float32Array):GPUBuffer => {
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
    });
    new Float32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();
    return buffer;
}

// create a storage buffer
const createStorageBuffer = (data: Float32Array):GPUBuffer => {
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | 
               GPUBufferUsage.COPY_SRC,
        mappedAtCreation: true,
    });
    new Float32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();
    return buffer;
}
```
We can simplify this code using `webgpu-simplified` with the following code:

```
import * as ws from 'webgpu-simplified';

// create a vertex buffer using data with a type of Float32Array:
const vertexBuffer = ws.createBufferWithData(device, data);

// create an index buffer using data with a type of Uint32Array:
const indexBuffer = ws.createBufferWithData(device, data);

// create a uniform buffer using data with a type of Float32Array:
const uniformBuffer = ws.createBufferWithData(device, data, ws.BufferType.Uniform);

// create a storage buffer using data with a type of Float32Array:
const uniformBuffer = ws.createBufferWithData(device, data, ws.BufferType.Storage); 
```

## Transformations

Like WebGL, WebGPU does not provide any functions for working with model, view, and projection transformations. 
In this mini library, I implement several helper functions for creating varous 3D transformations using a popular JavaScript package `gl-matrix`.

Here is the sample code for creating transformations:

```
import * as ws from 'webgpu-simplified';

// create a model matrix using translation, rotation, and scale:
const modelMat = ws.createModelMat(translation, rotation, scale);

// create a view matrix and a camera
const vt = ws.createViewTransform(cameraPosition);
const viewMat = vt.viewMat;
let camera = ws.getCamera(canvas, vt.cameraOptions);

// create a projection matrix:
const projectionMat = ws.createProjectionMat(aspectRatio);

// combine model, view, and projection matrices to form mvp matrix:
const mvpMat = ws.combineMvpMat(modelMat, viewMat, projectionMat);

```
You can see that our package also include a `getCamera` function based a `npm` library `3d-view-controls`. 
This function let you create an easy to use camera that allows you to interact with graphics objects in
the scene using mouse, such as pan, rotate, and zoom in/out the objects.

## Utility

This package also include some utility functions.

#license

Copyright (c) 2023 Dr. Jack Xu. MIT License.