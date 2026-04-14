// TensorFlow.js 类型声明
// 这些类型用于在没有安装@tensorflow/tfjs时提供类型支持

declare module '@tensorflow/tfjs' {
  export interface Tensor {
    dispose(): void;
    dataSync(): Float32Array | Int32Array | Uint8Array;
    data(): Promise<Float32Array | Int32Array | Uint8Array>;
    shape: number[];
    dtype: 'float32' | 'int32' | 'bool' | 'string' | 'complex64' | 'quantized_uint8';
  }

  export interface LayersModel {
    predict(inputs: Tensor | Tensor[] | {[key: string]: Tensor}): Tensor | Tensor[] | {[key: string]: Tensor};
    predict(inputs: unknown, config?: unknown): unknown;
    dispose(): void;
    save(savePath: string): Promise<unknown>;
    load(path: string): Promise<LayersModel>;
  }

  export interface TensorFlowModule {
    loadLayersModel(path: string): Promise<LayersModel>;
    browser: {
      fromPixels(element: HTMLCanvasElement | ImageData | HTMLImageElement): Tensor;
    };
    tensor(data: unknown, shape?: number[], dtype?: string): Tensor;
    tensor2d(data: unknown, shape?: [number, number], dtype?: string): Tensor;
    sequential(config?: unknown): unknown;
    dispose(tensors: Tensor | Tensor[]): void;
  }

  const tf: TensorFlowModule;
  export { tf };
}

// 声明 quagga2 模块
declare module '@ericblade/quagga2' {
  interface QuaggaConfig {
    inputStream: {
      type: string;
      target?: HTMLElement | Element | string;
      constraints?: {
        width?: { min?: number; ideal?: number; max?: number } | number;
        height?: { min?: number; ideal?: number; max?: number } | number;
        facingMode?: string;
        aspectRatio?: { min?: number; max?: number };
      };
    };
    locator?: {
      patchSize?: string;
      halfSample?: boolean;
    };
    numOfWorkers?: number;
    frequency?: number;
    decoder?: {
      readers?: string[];
    };
    locate?: boolean;
    src?: string;
  }

  interface QuaggaResultObject {
    codeResult?: {
      code?: string;
      format?: string;
      decCodes?: number[];
      decodedCodes?: Array<{ code?: string; error?: number; start?: number; end?: number; codeset?: number }>;
    };
    line?: { x1?: number; y1?: number; x2?: number; y2?: number };
    angle?: number;
    pattern?: number[];
    boxes?: Array<Array<{ x?: number; y?: number }>>;
  }

  interface QuaggaCallbacks {
    processed?: (result: QuaggaResultObject) => void;
    detected?: (result: QuaggaResultObject) => void;
  }

  interface QuaggaStatic {
    init(config: QuaggaConfig): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    onDetected(callback: (result: QuaggaResultObject) => void): void;
    onProcessed(callback: (result: QuaggaResultObject) => void): void;
    offDetected(callback?: (result: QuaggaResultObject) => void): void;
    offProcessed(callback?: (result: QuaggaResultObject) => void): void;
    decodeSingle(config: QuaggaConfig, callback: (result: QuaggaResultObject) => void): void;
    call(cameraId: string): Promise<unknown>;
    getCameras(): Promise<Array<{ deviceId: string; label: string }>>;
  }

  const Quagga: QuaggaStatic;
  export default Quagga;
}
