# 顶尖 OS2 电子秤串口驱动插件

**目标：** 在 IoTBrowser 平台中实现顶尖 OS2 系列电子秤的串口驱动，实时采集并推送重量数据  
**技术栈：** C# .NET 7.0

---

## Task 1: 核心驱动 Os2Driver

> 负责串口初始化、数据接收、帧解析与重量事件推送

**文件：** `Os2Driver.cs`

- [ ] 继承 ComBase，重写 Type/Name 属性
- [ ] 实现 Init(port, baudRate) 初始化 SerialPort（9600,N,8,1）
- [ ] 注册 DataReceived 事件，按 16 字节帧读取
- [ ] 校验帧头 0x01，无效则清空缓冲区
- [ ] 提取字节 3-11 共 9 字节，ASCII 解码后剔除 "kg"/"g" 转 float
- [ ] 与上一次数据对比，变化时触发 OnPushData 事件
- [ ] 实现 Open()/Close() 方法，维护 Opened 状态
- [ ] 线程安全：使用 lock (_locker) 保护共享数据

---

## Task 2: 本地控制台测试程序

> 供开发阶段本地验证驱动功能，无需 IoTBrowser 环境

**文件：** `Program.cs`

- [ ] Main 中循环读取串口号，初始化并打开驱动
- [ ] 订阅 OnPushData 事件，控制台打印时间戳 + 重量
- [ ] 按任意键退出，确保驱动 Close 并释放事件

---

## Task 3: 项目构建与运行脚本

> 提供一键编译、复制到 Plugins/Com 目录的脚本

**文件：** `build.sh`（Linux） / `build.bat`（Windows）

- [ ] `dotnet build -c Release` 生成 DLL
- [ ] 将输出拷贝到 `Plugins/Com/` 文件夹（无则创建）
- [ ] 打印提示：IoTBrowser 需设置驱动型号为 DJ_Os2 并填写实际串口号