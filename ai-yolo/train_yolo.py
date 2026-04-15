#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
海邻到家 - YOLOv8 自定义商品识别模型训练

训练自定义商品识别模型

使用方法：
    python train_yolo.py --train
    python train_yolo.py --predict --image path/to/image.jpg
    python train_yolo.py --export --model best.pt
"""

import os
import sys
import argparse
from pathlib import Path
from datetime import datetime

# 添加当前目录到路径
sys.path.insert(0, str(Path(__file__).parent))

def check_dependencies():
    """检查依赖"""
    required = ['ultralytics', 'cv2', 'numpy']
    missing = []
    
    for lib in required:
        try:
            __import__(lib)
        except ImportError:
            missing.append(lib)
    
    if missing:
        print(f"缺少依赖: {', '.join(missing)}")
        print("请先安装: pip install -r requirements.txt")
        return False
    return True

def prepare_dataset():
    """准备数据集"""
    print("\n" + "=" * 60)
    print("准备数据集")
    print("=" * 60)
    
    # 数据集目录
    project_dir = Path(__file__).parent
    data_dir = project_dir / "dataset"
    
    # 创建目录结构
    (data_dir / "images" / "train").mkdir(parents=True, exist_ok=True)
    (data_dir / "images" / "val").mkdir(parents=True, exist_ok=True)
    (data_dir / "labels" / "train").mkdir(parents=True, exist_ok=True)
    (data_dir / "labels" / "val").mkdir(parents=True, exist_ok=True)
    
    # 创建数据配置文件
    data_yaml = data_dir / "data.yaml"
    data_yaml.write_text(f"""
# 训练数据配置
path: {data_dir}
train: images/train
val: images/val

# 类别名称
names:
  0: apple
  1: banana
  2: orange
  3: milk
  4: bread
  5: cola
  6: water
  7: coffee
  8: cookie
  9: chocolate
  10: broccoli
  11: carrot

# 类别数量
nc: 12
""")
    
    print(f"✓ 数据集目录: {data_dir}")
    print(f"✓ 配置文件: {data_yaml}")
    print()
    print("请将训练图片放入:")
    print(f"  - 训练集: {data_dir}/images/train/")
    print(f"  - 验证集: {data_dir}/images/val/")
    print()
    print("使用 LabelImg 标注图片:")
    print("  pip install labelImg")
    print("  labelImg")
    print()
    
    return data_yaml

def train_model(epochs: int = 100, batch_size: int = 16, image_size: int = 640):
    """训练模型"""
    from ultralytics import YOLO
    
    print("\n" + "=" * 60)
    print("开始训练")
    print("=" * 60)
    
    project_dir = Path(__file__).parent
    data_yaml = project_dir / "dataset" / "data.yaml"
    runs_dir = project_dir / "runs"
    
    if not data_yaml.exists():
        print("错误: 数据配置文件不存在")
        print("请先运行: python train_yolo.py --prepare")
        return None
    
    # 创建输出目录
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir = runs_dir / f"train_{timestamp}"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"模型: YOLOv8n")
    print(f"数据: {data_yaml}")
    print(f"轮次: {epochs}")
    print(f"批次: {batch_size}")
    print(f"图片大小: {image_size}")
    print(f"输出目录: {output_dir}")
    print()
    
    try:
        # 加载预训练模型
        model = YOLO('yolov8n.pt')
        
        # 开始训练
        results = model.train(
            data=str(data_yaml),
            epochs=epochs,
            batch=batch_size,
            imgsz=image_size,
            project=str(runs_dir),
            name=f'train_{timestamp}',
            exist_ok=True,
            pretrained=True,
            optimizer='SGD',
            lr0=0.01,
            momentum=0.937,
            weight_decay=0.0005,
            patience=50,
            save=True,
            save_period=10,
            cache=True,
            device=0,  # GPU设备，设为 'cpu' 使用CPU
            workers=8,
            verbose=True
        )
        
        # 保存最佳模型
        best_model_path = runs_dir / f'train_{timestamp}' / 'weights' / 'best.pt'
        if best_model_path.exists():
            final_path = project_dir / 'models' / 'best.pt'
            final_path.parent.mkdir(exist_ok=True)
            best_model_path.rename(final_path)
            print(f"\n✓ 最佳模型已保存: {final_path}")
        
        print("\n训练完成!")
        return results
        
    except Exception as e:
        print(f"训练失败: {e}")
        import traceback
        traceback.print_exc()
        return None

def predict_image(image_path: str, model_path: str = 'models/best.pt'):
    """预测单张图片"""
    from ultralytics import YOLO
    import cv2
    
    print("\n" + "=" * 60)
    print("预测图片")
    print("=" * 60)
    
    project_dir = Path(__file__).parent
    
    # 查找模型
    if not model_path:
        model_path = project_dir / 'models' / 'best.pt'
    else:
        model_path = Path(model_path)
    
    if not model_path.exists():
        print(f"错误: 模型文件不存在: {model_path}")
        print("请先训练模型: python train_yolo.py --train")
        return
    
    if not Path(image_path).exists():
        print(f"错误: 图片文件不存在: {image_path}")
        return
    
    print(f"图片: {image_path}")
    print(f"模型: {model_path}")
    print()
    
    try:
        # 加载模型
        model = YOLO(str(model_path))
        
        # 读取图片
        img = cv2.imread(image_path)
        
        # 预测
        results = model(img, conf=0.5)
        
        # 显示结果
        result = results[0]
        boxes = result.boxes
        
        print(f"检测到 {len(boxes)} 个对象:")
        for i, box in enumerate(boxes):
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            name = result.names[cls]
            print(f"  {i+1}. {name}: {conf:.2f}")
        
        # 保存结果
        output_path = Path(image_path).parent / f"result_{Path(image_path).name}"
        annotated = result.plot()
        cv2.imwrite(str(output_path), annotated)
        print(f"\n结果已保存: {output_path}")
        
        return result
        
    except Exception as e:
        print(f"预测失败: {e}")
        import traceback
        traceback.print_exc()

def export_model(model_path: str, format: str = 'onnx'):
    """导出模型"""
    from ultralytics import YOLO
    
    print("\n" + "=" * 60)
    print(f"导出模型 ({format})")
    print("=" * 60)
    
    project_dir = Path(__file__).parent
    model_path = project_dir / model_path if not Path(model_path).is_absolute() else Path(model_path)
    
    if not model_path.exists():
        print(f"错误: 模型文件不存在: {model_path}")
        return
    
    print(f"输入模型: {model_path}")
    print(f"输出格式: {format}")
    print()
    
    try:
        model = YOLO(str(model_path))
        exported_path = model.export(format=format)
        
        print(f"✓ 模型已导出: {exported_path}")
        return exported_path
        
    except Exception as e:
        print(f"导出失败: {e}")
        import traceback
        traceback.print_exc()

def batch_predict(image_dir: str, model_path: str = 'models/best.pt'):
    """批量预测"""
    from ultralytics import YOLO
    import cv2
    
    print("\n" + "=" * 60)
    print("批量预测")
    print("=" * 60)
    
    project_dir = Path(__file__).parent
    image_dir = Path(image_dir)
    
    # 查找模型
    if not model_path:
        model_path = project_dir / 'models' / 'best.pt'
    else:
        model_path = Path(model_path)
    
    if not model_path.exists():
        print(f"错误: 模型文件不存在: {model_path}")
        return
    
    if not image_dir.exists():
        print(f"错误: 图片目录不存在: {image_dir}")
        return
    
    print(f"图片目录: {image_dir}")
    print(f"模型: {model_path}")
    print()
    
    # 获取图片
    images = list(image_dir.glob("*.jpg")) + list(image_dir.glob("*.png"))
    
    if not images:
        print("目录中没有图片")
        return
    
    print(f"找到 {len(images)} 张图片")
    print()
    
    try:
        model = YOLO(str(model_path))
        
        results_summary = []
        
        for img_path in images:
            results = model(img_path, conf=0.5)
            result = results[0]
            boxes = result.boxes
            
            print(f"{img_path.name}: {len(boxes)} 个对象")
            for box in boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                name = result.names[cls]
                print(f"  - {name}: {conf:.2f}")
            
            # 保存结果
            output_path = image_dir / f"result_{img_path.name}"
            annotated = result.plot()
            cv2.imwrite(str(output_path), annotated)
            
            results_summary.append({
                'image': img_path.name,
                'count': len(boxes),
                'products': [result.names[int(b.cls[0])] for b in boxes]
            })
        
        # 保存汇总
        summary_path = image_dir / "batch_results.json"
        import json
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(results_summary, f, ensure_ascii=False, indent=2)
        
        print(f"\n结果汇总已保存: {summary_path}")
        
    except Exception as e:
        print(f"批量预测失败: {e}")
        import traceback
        traceback.print_exc()

def main():
    """主入口"""
    if not check_dependencies():
        sys.exit(1)
    
    parser = argparse.ArgumentParser(description='海邻到家 YOLOv8 训练工具')
    
    parser.add_argument('--prepare', action='store_true', help='准备数据集目录')
    parser.add_argument('--train', action='store_true', help='训练模型')
    parser.add_argument('--predict', action='store_true', help='预测单张图片')
    parser.add_argument('--batch', action='store_true', help='批量预测')
    parser.add_argument('--export', action='store_true', help='导出模型')
    
    parser.add_argument('--image', type=str, help='图片路径')
    parser.add_argument('--dir', type=str, help='图片目录')
    parser.add_argument('--model', type=str, default='models/best.pt', help='模型路径')
    parser.add_argument('--epochs', type=int, default=100, help='训练轮次')
    parser.add_argument('--batch', type=int, default=16, help='批次大小')
    parser.add_argument('--size', type=int, default=640, help='图片大小')
    parser.add_argument('--format', type=str, default='onnx', help='导出格式')
    
    args = parser.parse_args()
    
    print()
    print("=" * 60)
    print("海邻到家 - YOLOv8 训练工具")
    print("=" * 60)
    print()
    
    # 执行命令
    if args.prepare:
        prepare_dataset()
        
    elif args.train:
        data_yaml = prepare_dataset()
        print("\n请将训练数据放入 dataset 目录后，运行:")
        print(f"python -c \"from train_yolo import train_model; train_model({args.epochs}, {args.batch}, {args.size})\"")
        
        # 自动开始训练（如果数据已准备好）
        import os
        train_images = Path('dataset/images/train')
        if any(train_images.glob('*.jpg')) or any(train_images.glob('*.png')):
            print("\n检测到训练数据，开始训练...")
            train_model(args.epochs, args.batch, args.size)
        else:
            print("\n等待添加训练数据...")
            
    elif args.predict:
        if not args.image:
            print("错误: 请指定图片路径 --image")
            sys.exit(1)
        predict_image(args.image, args.model)
        
    elif args.batch:
        if not args.dir:
            print("错误: 请指定图片目录 --dir")
            sys.exit(1)
        batch_predict(args.dir, args.model)
        
    elif args.export:
        export_model(args.model, args.format)
        
    else:
        parser.print_help()
        print("\n示例:")
        print("  python train_yolo.py --prepare              # 准备数据集")
        print("  python train_yolo.py --train                 # 训练模型")
        print("  python train_yolo.py --predict --image 1.jpg  # 预测图片")
        print("  python train_yolo.py --batch --dir ./test     # 批量预测")

if __name__ == '__main__':
    main()
