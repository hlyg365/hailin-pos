'use client';

import { cn } from '@/lib/utils';
import {
  Wine,
  Coffee,
  GlassWater,
  Apple,
  Cherry,
  Citrus,
  Carrot,
  Salad,
  LeafyGreen,
  Cookie,
  Candy,
  Popcorn,
  Beef,
  Fish,
  Drumstick,
  Home,
  Bath,
  SprayCan,
  Snowflake,
  Refrigerator,
  Milk,
  Egg,
  Pizza,
  Sandwich,
  IceCreamBowl,
  Cake,
  Beer,
  Banana,
  Grape,
  UtensilsCrossed,
  ShoppingBag,
  Package,
  Gift,
  Sparkles,
  Shirt,
  Lamp,
  Sofa,
  Tv,
  Smartphone,
  Laptop,
  Headphones,
  Camera,
  BookOpen,
  PenTool,
  Palette,
  Music,
  Gamepad2,
  Dumbbell,
  HeartPulse,
  Pill,
  Stethoscope,
  Car,
  Bike,
  Fuel,
  Wrench,
  Hammer,
  Baby,
  PawPrint,
  Flower2,
  TreePine,
  Sun,
  Droplets,
  Wind,
  Flame,
  Zap,
  Star,
  Crown,
  Gem,
  Diamond,
  CircleDot,
  Square,
  Triangle,
  Hexagon,
  type LucideIcon,
} from 'lucide-react';

// 分类图标配置
export interface CategoryIconConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  gradient: string; // 渐变背景色
  category: string; // 所属分类组
}

// 预设的分类图标列表
export const categoryIcons: CategoryIconConfig[] = [
  // 饮品类
  { id: 'wine', name: '酒水', icon: Wine, gradient: 'from-rose-500 to-pink-500', category: '饮品类' },
  { id: 'coffee', name: '咖啡', icon: Coffee, gradient: 'from-amber-600 to-orange-500', category: '饮品类' },
  { id: 'glass-water', name: '饮料', icon: GlassWater, gradient: 'from-cyan-500 to-blue-500', category: '饮品类' },
  { id: 'beer', name: '啤酒', icon: Beer, gradient: 'from-yellow-500 to-amber-500', category: '饮品类' },
  { id: 'milk', name: '牛奶', icon: Milk, gradient: 'from-slate-100 to-slate-300', category: '饮品类' },
  
  // 水果类
  { id: 'apple', name: '苹果', icon: Apple, gradient: 'from-red-500 to-rose-500', category: '水果类' },
  { id: 'banana', name: '香蕉', icon: Banana, gradient: 'from-yellow-400 to-yellow-500', category: '水果类' },
  { id: 'grape', name: '葡萄', icon: Grape, gradient: 'from-purple-500 to-violet-500', category: '水果类' },
  { id: 'citrus', name: '柑橘', icon: Citrus, gradient: 'from-orange-500 to-amber-500', category: '水果类' },
  { id: 'cherry', name: '樱桃', icon: Cherry, gradient: 'from-red-600 to-pink-600', category: '水果类' },
  { id: 'strawberry', name: '草莓', icon: Cherry, gradient: 'from-red-400 to-pink-400', category: '水果类' },
  { id: 'orange', name: '橙子', icon: Citrus, gradient: 'from-lime-500 to-green-500', category: '水果类' },
  
  // 蔬菜类
  { id: 'carrot', name: '胡萝卜', icon: Carrot, gradient: 'from-orange-400 to-amber-500', category: '蔬菜类' },
  { id: 'salad', name: '沙拉', icon: Salad, gradient: 'from-green-400 to-emerald-500', category: '蔬菜类' },
  { id: 'leafy-green', name: '绿叶菜', icon: LeafyGreen, gradient: 'from-green-500 to-teal-500', category: '蔬菜类' },
  { id: 'pepper', name: '辣椒', icon: Flame, gradient: 'from-red-500 to-orange-500', category: '蔬菜类' },
  { id: 'corn', name: '玉米', icon: Sun, gradient: 'from-yellow-400 to-amber-400', category: '蔬菜类' },
  { id: 'onion', name: '洋葱', icon: CircleDot, gradient: 'from-violet-400 to-purple-400', category: '蔬菜类' },
  
  // 零食类
  { id: 'cookie', name: '饼干', icon: Cookie, gradient: 'from-amber-500 to-yellow-600', category: '零食类' },
  { id: 'candy', name: '糖果', icon: Candy, gradient: 'from-pink-500 to-rose-500', category: '零食类' },
  { id: 'popcorn', name: '爆米花', icon: Popcorn, gradient: 'from-yellow-400 to-orange-400', category: '零食类' },
  { id: 'cake', name: '蛋糕', icon: Cake, gradient: 'from-pink-400 to-fuchsia-400', category: '零食类' },
  { id: 'ice-cream', name: '冰淇淋', icon: IceCreamBowl, gradient: 'from-sky-400 to-cyan-400', category: '零食类' },
  
  // 生鲜类
  { id: 'beef', name: '牛肉', icon: Beef, gradient: 'from-red-600 to-rose-600', category: '生鲜类' },
  { id: 'fish', name: '鱼类', icon: Fish, gradient: 'from-blue-400 to-cyan-400', category: '生鲜类' },
  { id: 'drumstick', name: '鸡肉', icon: Drumstick, gradient: 'from-amber-600 to-orange-600', category: '生鲜类' },
  { id: 'egg', name: '鸡蛋', icon: Egg, gradient: 'from-amber-200 to-yellow-300', category: '生鲜类' },
  { id: 'cheese', name: '奶酪', icon: Gift, gradient: 'from-yellow-400 to-amber-400', category: '生鲜类' },
  { id: 'bread', name: '面包', icon: Pizza, gradient: 'from-amber-500 to-orange-500', category: '生鲜类' },
  
  // 日用品类
  { id: 'home', name: '家居', icon: Home, gradient: 'from-slate-500 to-gray-600', category: '日用品类' },
  { id: 'bath', name: '浴室', icon: Bath, gradient: 'from-sky-400 to-blue-500', category: '日用品类' },
  { id: 'spray-can', name: '清洁', icon: SprayCan, gradient: 'from-teal-400 to-cyan-500', category: '日用品类' },
  { id: 'shirt', name: '服装', icon: Shirt, gradient: 'from-indigo-500 to-violet-500', category: '日用品类' },
  
  // 数码电器
  { id: 'smartphone', name: '手机', icon: Smartphone, gradient: 'from-slate-600 to-zinc-700', category: '数码电器' },
  { id: 'laptop', name: '电脑', icon: Laptop, gradient: 'from-gray-600 to-slate-700', category: '数码电器' },
  { id: 'headphones', name: '耳机', icon: Headphones, gradient: 'from-violet-500 to-purple-600', category: '数码电器' },
  { id: 'camera', name: '相机', icon: Camera, gradient: 'from-gray-500 to-slate-600', category: '数码电器' },
  { id: 'tv', name: '电视', icon: Tv, gradient: 'from-slate-500 to-gray-600', category: '数码电器' },
  
  // 文体办公
  { id: 'book', name: '图书', icon: BookOpen, gradient: 'from-emerald-500 to-teal-500', category: '文体办公' },
  { id: 'pen-tool', name: '文具', icon: PenTool, gradient: 'from-blue-500 to-indigo-500', category: '文体办公' },
  { id: 'palette', name: '美术', icon: Palette, gradient: 'from-pink-500 to-purple-500', category: '文体办公' },
  { id: 'music', name: '音乐', icon: Music, gradient: 'from-violet-500 to-fuchsia-500', category: '文体办公' },
  { id: 'gamepad', name: '游戏', icon: Gamepad2, gradient: 'from-indigo-500 to-violet-500', category: '文体办公' },
  
  // 健康保健
  { id: 'dumbbell', name: '健身', icon: Dumbbell, gradient: 'from-orange-500 to-red-500', category: '健康保健' },
  { id: 'heart-pulse', name: '健康', icon: HeartPulse, gradient: 'from-red-500 to-pink-500', category: '健康保健' },
  { id: 'pill', name: '药品', icon: Pill, gradient: 'from-green-500 to-emerald-500', category: '健康保健' },
  { id: 'stethoscope', name: '医疗', icon: Stethoscope, gradient: 'from-blue-500 to-cyan-500', category: '健康保健' },
  
  // 汽车出行
  { id: 'car', name: '汽车', icon: Car, gradient: 'from-slate-600 to-gray-700', category: '汽车出行' },
  { id: 'bike', name: '自行车', icon: Bike, gradient: 'from-teal-500 to-cyan-500', category: '汽车出行' },
  { id: 'fuel', name: '加油', icon: Fuel, gradient: 'from-amber-500 to-orange-500', category: '汽车出行' },
  { id: 'wrench', name: '维修', icon: Wrench, gradient: 'from-gray-500 to-slate-600', category: '汽车出行' },
  
  // 母婴宠物
  { id: 'baby', name: '母婴', icon: Baby, gradient: 'from-pink-400 to-rose-400', category: '母婴宠物' },
  { id: 'paw-print', name: '宠物', icon: PawPrint, gradient: 'from-amber-500 to-orange-500', category: '母婴宠物' },
  
  // 其他
  { id: 'snowflake', name: '冷冻', icon: Snowflake, gradient: 'from-sky-400 to-blue-500', category: '其他' },
  { id: 'refrigerator', name: '冷藏', icon: Refrigerator, gradient: 'from-cyan-400 to-sky-500', category: '其他' },
  { id: 'package', name: '包装', icon: Package, gradient: 'from-amber-500 to-yellow-500', category: '其他' },
  { id: 'gift', name: '礼品', icon: Gift, gradient: 'from-pink-500 to-rose-500', category: '其他' },
  { id: 'sparkles', name: '促销', icon: Sparkles, gradient: 'from-yellow-400 to-amber-500', category: '其他' },
  { id: 'star', name: '推荐', icon: Star, gradient: 'from-yellow-400 to-orange-400', category: '其他' },
  { id: 'crown', name: '精品', icon: Crown, gradient: 'from-amber-400 to-yellow-500', category: '其他' },
  { id: 'gem', name: '高级', icon: Gem, gradient: 'from-violet-500 to-purple-500', category: '其他' },
];

// 获取图标配置
export function getIconConfig(iconId: string): CategoryIconConfig | undefined {
  return categoryIcons.find(icon => icon.id === iconId);
}

// 图标选择器组件
interface CategoryIconPickerProps {
  value?: string;
  onChange: (iconId: string) => void;
  className?: string;
}

export function CategoryIconPicker({ value, onChange, className }: CategoryIconPickerProps) {
  const selectedIcon = getIconConfig(value || '');
  
  // 按分类分组
  const groupedIcons = categoryIcons.reduce((acc, icon) => {
    if (!acc[icon.category]) {
      acc[icon.category] = [];
    }
    acc[icon.category].push(icon);
    return acc;
  }, {} as Record<string, CategoryIconConfig[]>);

  return (
    <div className={cn('space-y-4', className)}>
      {/* 已选图标预览 */}
      {selectedIcon && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm',
            selectedIcon.gradient
          )}>
            <selectedIcon.icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="font-medium">{selectedIcon.name}</div>
            <div className="text-xs text-muted-foreground">{selectedIcon.category}</div>
          </div>
        </div>
      )}
      
      {/* 图标列表 */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {Object.entries(groupedIcons).map(([category, icons]) => (
          <div key={category}>
            <div className="text-xs font-medium text-muted-foreground mb-2 px-1">{category}</div>
            <div className="grid grid-cols-6 gap-1.5">
              {icons.map((iconConfig) => {
                const Icon = iconConfig.icon;
                const isSelected = value === iconConfig.id;
                
                return (
                  <button
                    key={iconConfig.id}
                    type="button"
                    onClick={() => onChange(iconConfig.id)}
                    className={cn(
                      'relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
                      'hover:scale-110 hover:shadow-md',
                      isSelected 
                        ? 'ring-2 ring-primary ring-offset-2 shadow-md' 
                        : 'hover:bg-muted'
                    )}
                    title={iconConfig.name}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br',
                      iconConfig.gradient
                    )}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 图标显示组件（用于列表展示）
interface CategoryIconDisplayProps {
  iconId?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CategoryIconDisplay({ iconId, size = 'md', className }: CategoryIconDisplayProps) {
  const iconConfig = getIconConfig(iconId || '');
  
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl',
  };
  
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
  };
  
  if (!iconConfig) {
    // 默认图标
    return (
      <div className={cn(
        'flex items-center justify-center bg-gradient-to-br from-slate-400 to-slate-500',
        sizeClasses[size],
        className
      )}>
        <Package className={cn(iconSizes[size], 'text-white')} />
      </div>
    );
  }
  
  const Icon = iconConfig.icon;
  
  return (
    <div className={cn(
      'flex items-center justify-center bg-gradient-to-br shadow-sm',
      sizeClasses[size],
      iconConfig.gradient,
      className
    )}>
      <Icon className={cn(iconSizes[size], 'text-white')} />
    </div>
  );
}

export default CategoryIconPicker;
