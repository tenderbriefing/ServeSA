"use strict";
/**
 * ServeSA canonical case-creation contract
 * Shared by apps/web and apps/functions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CANONICAL_CATEGORIES = exports.CreateCaseResponseSchema = exports.CreateCaseInputSchema = exports.GeoresolutionStatusSchema = exports.LocationSourceSchema = exports.PrioritySchema = exports.CanonicalCategorySchema = exports.CONSENT_POLICY_VERSION = exports.CASE_CONTRACT_VERSION = void 0;
exports.parseCreateCaseInput = parseCreateCaseInput;
exports.safeParseCreateCaseInput = safeParseCreateCaseInput;
const zod_1 = require("zod");
const categories_1 = require("./categories");
const phone_1 = require("./phone");
const geo_1 = require("./geo");
exports.CASE_CONTRACT_VERSION = '1.0.0';
exports.CONSENT_POLICY_VERSION = '2025-08-01';
const trimString = (min, max) => zod_1.z
    .string()
    .transform((v) => v.trim().replace(/\s+/g, ' '))
    .pipe(zod_1.z.string().min(min).max(max));
exports.CanonicalCategorySchema = zod_1.z.enum([
    'water',
    'electricity',
    'roads',
    'waste',
    'internet',
    'emergency',
]);
exports.PrioritySchema = zod_1.z.enum(['emergency', 'high', 'medium', 'low']);
exports.LocationSourceSchema = zod_1.z.enum([
    'device_gps',
    'map_pin',
    'address_search',
]);
exports.GeoresolutionStatusSchema = zod_1.z.enum([
    'polygon_match', // unique authoritative GIS match (resolved)
    'ambiguous', // multiple conflicting polygons contain the point
    'nearest_ward', // legacy / advisory only — never authoritative routing
    'municipality_only',
    'unresolved',
]);
const CreateCaseInputBaseSchema = zod_1.z.object({
    title: trimString(5, 200),
    description: trimString(10, 2000),
    // string here so unsupported UI IDs can produce a friendly message in superRefine
    category: zod_1.z.string().min(1),
    subcategory: zod_1.z.string().trim().max(100).optional(),
    priority: exports.PrioritySchema,
    latitude: zod_1.z.number().finite(),
    longitude: zod_1.z.number().finite(),
    locationSource: exports.LocationSourceSchema,
    address: zod_1.z.string().trim().max(500).optional(),
    reporter: zod_1.z.object({
        name: trimString(2, 120),
        email: zod_1.z.string().trim().email().optional(),
        phone: zod_1.z.string().trim().optional(),
    }),
    consent: zod_1.z.object({
        dataProcessing: zod_1.z.literal(true, {
            errorMap: () => ({
                message: 'Data-processing consent is required to submit a report.',
            }),
        }),
        communications: zod_1.z.boolean().optional(),
    }),
    clientRequestId: zod_1.z
        .string()
        .uuid({ message: 'clientRequestId must be a UUID' }),
});
/**
 * Preprocess raw client payloads:
 * - map UI / legacy category IDs → canonical
 * - fill subcategory from mapping when absent
 * - normalise empty strings to undefined
 */
function preprocessCreateCaseInput(raw) {
    if (!raw || typeof raw !== 'object')
        return raw;
    const input = { ...raw };
    if (typeof input.category === 'string') {
        const mapped = (0, categories_1.mapUiCategoryToCanonical)(input.category);
        if (!mapped) {
            // Leave invalid category for Zod to reject with a clear message
            input.category = `__unsupported__:${input.category}`;
        }
        else {
            input.category = mapped.category;
            if (!input.subcategory && mapped.subcategory) {
                input.subcategory = mapped.subcategory;
            }
        }
    }
    // Normalise empty optional strings
    if (input.address === '')
        input.address = undefined;
    if (input.subcategory === '')
        input.subcategory = undefined;
    if (input.reporter && typeof input.reporter === 'object') {
        const reporter = { ...input.reporter };
        if (reporter.email === '')
            reporter.email = undefined;
        if (reporter.phone === '')
            reporter.phone = undefined;
        input.reporter = reporter;
    }
    return input;
}
exports.CreateCaseInputSchema = zod_1.z.preprocess(preprocessCreateCaseInput, CreateCaseInputBaseSchema.superRefine((data, ctx) => {
    if (String(data.category).startsWith('__unsupported__:')) {
        const original = String(data.category).replace('__unsupported__:', '');
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['category'],
            message: `Unsupported category "${original}". Choose a supported service category.`,
        });
        return;
    }
    if (data.latitude === 0 && data.longitude === 0) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['latitude'],
            message: 'A valid South African location is required (0,0 is not allowed).',
        });
    }
    if (data.latitude < geo_1.SA_BOUNDS.minLat ||
        data.latitude > geo_1.SA_BOUNDS.maxLat ||
        data.longitude < geo_1.SA_BOUNDS.minLng ||
        data.longitude > geo_1.SA_BOUNDS.maxLng) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['latitude'],
            message: 'Selected location is outside South Africa. Please choose a location within South Africa.',
        });
    }
    const email = data.reporter.email;
    const phone = data.reporter.phone
        ? (0, phone_1.normalizeSaPhone)(data.reporter.phone)
        : undefined;
    if (!email && !phone) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['reporter'],
            message: 'Provide at least an email address or a mobile number.',
        });
    }
    if (data.reporter.phone && !phone) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['reporter', 'phone'],
            message: 'Enter a valid South African mobile number.',
        });
    }
}).transform((data) => {
    const phone = data.reporter.phone
        ? (0, phone_1.normalizeSaPhone)(data.reporter.phone) ?? undefined
        : undefined;
    const category = data.category;
    return {
        ...data,
        category,
        subcategory: data.subcategory || undefined,
        address: data.address || undefined,
        reporter: {
            name: data.reporter.name,
            email: data.reporter.email || undefined,
            phone,
        },
    };
}));
exports.CreateCaseResponseSchema = zod_1.z.object({
    caseId: zod_1.z.string(),
    reference: zod_1.z.string(),
    shareUrl: zod_1.z.string().url(),
    status: zod_1.z.literal('submitted'),
    municipality: zod_1.z
        .object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
    })
        .optional(),
    ward: zod_1.z
        .object({
        id: zod_1.z.string(),
        number: zod_1.z.string().optional(),
        name: zod_1.z.string().optional(),
    })
        .optional(),
    slaTarget: zod_1.z.string(),
    targetHours: zod_1.z.number(),
    georesolutionStatus: exports.GeoresolutionStatusSchema,
    mediaUploadPath: zod_1.z.string().optional(),
    routingPending: zod_1.z.boolean().optional(),
    duplicateAssessment: zod_1.z
        .object({
        status: zod_1.z.enum(['pending', 'completed', 'skipped']),
        candidateCaseIds: zod_1.z.array(zod_1.z.string()).optional(),
    })
        .optional(),
});
function parseCreateCaseInput(input) {
    return exports.CreateCaseInputSchema.parse(input);
}
function safeParseCreateCaseInput(input) {
    return exports.CreateCaseInputSchema.safeParse(input);
}
var categories_2 = require("./categories");
Object.defineProperty(exports, "CANONICAL_CATEGORIES", { enumerable: true, get: function () { return categories_2.CANONICAL_CATEGORIES; } });
