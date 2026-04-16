// ============================================
// 海邻到家 - 促销模块导出
// ============================================

export { PromotionService, PromotionType, PromotionStatus, type Promotion, type PromotionRule, type PromotionTimeSlot, type CreatePromotionRequest, type PromotionResult, type CalculatePromotionRequest } from './services/promotionService';
export { usePromotions, usePromotionCalculator, useAvailablePromotions, useClearanceMode } from './hooks/usePromotion';
