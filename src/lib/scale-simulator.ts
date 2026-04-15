/**
 * 海邻到家 - 电子秤模拟器
 * 
 * 用于开发测试，无需连接真实电子秤即可测试 AI 识别功能
 * 
 * @example
 * ```typescript
 * import { ScaleSimulator } from '@/lib/scale-simulator';
 * 
 * const simulator = new ScaleSimulator({
 *   onWeightChange: (weight, stable) => {
 *     console.log(`重量: ${weight}kg`);
 *   },
 *   onStable: (weight) => {
 *     console.log('触发识别');
 *   }
 * });
 * 
 * simulator.start();
 * simulator.setWeight(0.5);  // 模拟放上 500g 商品
 * 
 * // 停止
 * simulator.stop();
 * ```
 */

// ============== 类型定义 ==============

/** 模拟器配置 */
export interface ScaleSimulatorConfig {
  /** 重量变化回调 */
  onWeightChange?: (weight: number, stable: boolean) => void;
  /** 重量稳定回调（触发识别） */
  onStable?: (weight: number) => void;
  /** 重量变化间隔（毫秒） */
  updateInterval?: number;
  /** 稳定判定时间（毫秒） */
  stableDelay?: number;
  /** 稳定判定阈值 */
  stableThreshold?: number;
  /** 最大重量（kg） */
  maxWeight?: number;
}

/** 模拟器状态 */
export interface ScaleSimulatorState {
  currentWeight: number;
  targetWeight: number;
  stable: boolean;
  running: boolean;
}

// ============== 电子秤模拟器 ==============

/**
 * 电子秤模拟器
 * 
 * 模拟电子秤的行为，包括：
 * - 重量渐进变化
 * - 稳定性检测
 * - 触发识别回调
 */
export class ScaleSimulator {
  private config: Required<ScaleSimulatorConfig>;
  private state: ScaleSimulatorState;
  private intervalId: NodeJS.Timeout | null = null;
  private stableTimerId: NodeJS.Timeout | null = null;
  private lastStableWeight: number = 0;
  
  constructor(config: ScaleSimulatorConfig = {}) {
    // 默认配置
    this.config = {
      onWeightChange: config.onWeightChange || (() => {}),
      onStable: config.onStable || (() => {}),
      updateInterval: config.updateInterval || 100,
      stableDelay: config.stableDelay || 500,
      stableThreshold: config.stableThreshold || 0.005,
      maxWeight: config.maxWeight || 15
    };
    
    this.state = {
      currentWeight: 0,
      targetWeight: 0,
      stable: true,
      running: false
    };
  }
  
  /**
   * 启动模拟器
   */
  start(): void {
    if (this.state.running) {
      console.warn('[ScaleSimulator] Already running');
      return;
    }
    
    this.state.running = true;
    console.log('[ScaleSimulator] Started');
    
    // 启动更新循环
    this.intervalId = setInterval(() => {
      this.update();
    }, this.config.updateInterval);
  }
  
  /**
   * 停止模拟器
   */
  stop(): void {
    if (!this.state.running) {
      return;
    }
    
    this.state.running = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.stableTimerId) {
      clearTimeout(this.stableTimerId);
      this.stableTimerId = null;
    }
    
    console.log('[ScaleSimulator] Stopped');
  }
  
  /**
   * 设置目标重量
   * 
   * @param weight 目标重量（kg）
   */
  setWeight(weight: number): void {
    // 限制范围
    this.state.targetWeight = Math.max(0, Math.min(weight, this.config.maxWeight));
    console.log(`[ScaleSimulator] Target weight set to ${this.state.targetWeight.toFixed(3)}kg`);
  }
  
  /**
   * 获取当前状态
   */
  getState(): Readonly<ScaleSimulatorState> {
    return { ...this.state };
  }
  
  /**
   * 是否正在运行
   */
  isRunning(): boolean {
    return this.state.running;
  }
  
  /**
   * 重置模拟器
   */
  reset(): void {
    this.state.targetWeight = 0;
    this.state.currentWeight = 0;
    this.state.stable = true;
    this.lastStableWeight = 0;
    
    if (this.stableTimerId) {
      clearTimeout(this.stableTimerId);
      this.stableTimerId = null;
    }
    
    this.config.onWeightChange(0, true);
    console.log('[ScaleSimulator] Reset');
  }
  
  /**
   * 更新循环
   */
  private update(): void {
    const { currentWeight, targetWeight } = this.state;
    
    // 计算差值
    const diff = targetWeight - currentWeight;
    
    // 如果差值很小，直接设置为目标值
    if (Math.abs(diff) < 0.001) {
      if (currentWeight !== targetWeight) {
        this.state.currentWeight = targetWeight;
        this.onWeightChange();
        this.scheduleStableCheck();
      }
      return;
    }
    
    // 渐进调整（模拟物理特性）
    const step = diff * 0.3;  // 每次调整30%
    this.state.currentWeight += step;
    
    // 标记为不稳定
    if (this.state.stable) {
      this.state.stable = false;
      
      // 清除稳定计时器
      if (this.stableTimerId) {
        clearTimeout(this.stableTimerId);
        this.stableTimerId = null;
      }
    }
    
    this.onWeightChange();
  }
  
  /**
   * 重量变化回调
   */
  private onWeightChange(): void {
    this.config.onWeightChange(this.state.currentWeight, this.state.stable);
  }
  
  /**
   * 安排稳定检测
   */
  private scheduleStableCheck(): void {
    // 清除之前的计时器
    if (this.stableTimerId) {
      clearTimeout(this.stableTimerId);
    }
    
    // 如果没有重量，跳过
    if (this.state.currentWeight < 0.01) {
      this.state.stable = true;
      this.lastStableWeight = 0;
      return;
    }
    
    // 设置稳定计时器
    this.stableTimerId = setTimeout(() => {
      this.checkStable();
    }, this.config.stableDelay);
  }
  
  /**
   * 检测是否稳定
   */
  private checkStable(): void {
    const { currentWeight, targetWeight } = this.state;
    
    // 检查重量是否接近目标值
    const diff = Math.abs(currentWeight - targetWeight);
    
    if (diff < this.config.stableThreshold) {
      this.state.stable = true;
      
      // 如果重量变化了（从0变为有重量，或从有重量变为0），触发识别
      const hasWeight = currentWeight >= 0.01;
      const wasEmpty = this.lastStableWeight < 0.01;
      
      if (hasWeight && wasEmpty) {
        console.log(`[ScaleSimulator] Stable weight detected: ${currentWeight.toFixed(3)}kg`);
        this.config.onStable(currentWeight);
        this.lastStableWeight = currentWeight;
      } else if (!hasWeight && !wasEmpty) {
        // 商品被取走
        console.log('[ScaleSimulator] Item removed');
        this.lastStableWeight = 0;
      }
      
      this.onWeightChange();
    } else {
      // 继续检测
      this.scheduleStableCheck();
    }
  }
}

// ============== 预设场景 ==============

/**
 * 预设的测试场景
 */
export const SCALE_SCENARIOS = {
  /**
   * 苹果场景
   */
  APPLE: {
    weight: 0.35,
    name: '苹果',
    price: 300
  },
  
  /**
   * 香蕉场景
   */
  BANANA: {
    weight: 0.5,
    name: '香蕉',
    price: 200
  },
  
  /**
   * 橙子场景
   */
  ORANGE: {
    weight: 0.42,
    name: '橙子',
    price: 250
  },
  
  /**
   * 牛奶场景
   */
  MILK: {
    weight: 0.25,
    name: '纯牛奶',
    price: 500
  },
  
  /**
   * 面包场景
   */
  BREAD: {
    weight: 0.38,
    name: '吐司面包',
    price: 680
  },
  
  /**
   * 混合场景
   */
  MIXED: [
    { weight: 0.35, name: '苹果', price: 300 },
    { weight: 0.5, name: '香蕉', price: 200 },
    { weight: 0.42, name: '橙子', price: 250 }
  ]
};

/**
 * 运行演示场景
 */
export function runDemoScenario(
  simulator: ScaleSimulator,
  scenario: keyof typeof SCALE_SCENARIOS | { weight: number }[]
): void {
  console.log('[ScaleSimulator] Running demo scenario:', scenario);
  
  // 3秒后放上商品
  setTimeout(() => {
    if (typeof scenario === 'string') {
      const scenarioData = SCALE_SCENARIOS[scenario];
      if ('weight' in scenarioData) {
        simulator.setWeight(scenarioData.weight);
      }
    } else if (Array.isArray(scenario)) {
      const totalWeight = scenario.reduce((sum, item) => sum + item.weight, 0);
      simulator.setWeight(totalWeight);
    }
  }, 3000);
  
  // 8秒后取走商品
  setTimeout(() => {
    simulator.setWeight(0);
  }, 8000);
}

// ============== React Hook ==============

/**
 * 电子秤模拟器 Hook
 * 
 * @example
 * ```tsx
 * function TestPage() {
 *   const { 
 *     weight, 
 *     stable, 
 *     simulateWeight,
 *     clearWeight,
 *     runScenario 
 *   } = useScaleSimulator();
 * 
 *   return (
 *     <div>
 *       <p>重量: {weight.toFixed(3)}kg</p>
 *       <p>状态: {stable ? '稳定' : '变化中'}</p>
 *       <button onClick={() => simulateWeight(0.5)}>
 *         模拟500g
 *       </button>
 *     </div>
 *   );
 * };
 * ```
 */
export function useScaleSimulator(config?: ScaleSimulatorConfig) {
  const simulatorRef = React.useRef<ScaleSimulator | null>(null);
  const [weight, setWeight] = React.useState(0);
  const [stable, setStable] = React.useState(true);
  const [running, setRunning] = React.useState(false);
  
  React.useEffect(() => {
    simulatorRef.current = new ScaleSimulator({
      ...config,
      onWeightChange: (w, s) => {
        setWeight(w);
        setStable(s);
        config?.onWeightChange?.(w, s);
      },
      onStable: (w) => {
        config?.onStable?.(w);
      }
    });
    
    return () => {
      simulatorRef.current?.stop();
    };
  }, []);
  
  const start = React.useCallback(() => {
    simulatorRef.current?.start();
    setRunning(true);
  }, []);
  
  const stop = React.useCallback(() => {
    simulatorRef.current?.stop();
    setRunning(false);
  }, []);
  
  const simulateWeight = React.useCallback((targetWeight: number) => {
    simulatorRef.current?.setWeight(targetWeight);
  }, []);
  
  const clearWeight = React.useCallback(() => {
    simulatorRef.current?.setWeight(0);
  }, []);
  
  const runScenario = React.useCallback((scenario: keyof typeof SCALE_SCENARIOS) => {
    if (simulatorRef.current) {
      runDemoScenario(simulatorRef.current, scenario);
    }
  }, []);
  
  return {
    weight,
    stable,
    running,
    start,
    stop,
    simulateWeight,
    clearWeight,
    runScenario,
    simulator: simulatorRef.current
  };
}

// 需要导入 React
import * as React from 'react';

// ============== 导出 ==============

export default ScaleSimulator;
