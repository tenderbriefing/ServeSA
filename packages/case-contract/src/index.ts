export {
  CASE_CONTRACT_VERSION,
  CONSENT_POLICY_VERSION,
  CanonicalCategorySchema,
  PrioritySchema,
  LocationSourceSchema,
  GeoresolutionStatusSchema,
  CreateCaseInputSchema,
  CreateCaseResponseSchema,
  parseCreateCaseInput,
  safeParseCreateCaseInput,
  type CreateCaseInput,
  type CreateCaseResponse,
  type CanonicalCategory,
  type Priority,
  type LocationSource,
  type GeoresolutionStatus,
} from './schema'

export {
  CATEGORY_DEFINITIONS,
  CANONICAL_CATEGORIES,
  mapUiCategoryToCanonical,
  getCategoryDefinition,
  listCitizenCategories,
  isCanonicalCategory,
  type CategoryDefinition,
  type MappedCategory,
} from './categories'

export { SA_BOUNDS, isWithinSouthAfrica, assertSouthAfricaCoords } from './geo'

export { normalizeSaPhone, isValidSaPhone } from './phone'

export {
  SLA_POLICY_VERSION,
  DEFAULT_SLA_HOURS,
  calculateSlaFields,
  getTargetHours,
  type SLAConfig,
  type MunicipalitySLAConfig,
  type SLACalculation,
} from './sla'
