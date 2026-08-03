/**
 * ServeSA Pilot: reCAPTCHA Enterprise Assessment Helper
 * Calls assessment API with token, returns risk score (flag-only, no blocking)
 */

import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

interface RecaptchaAssessment {
  riskAnalysis: {
    score: number;
    reasons: string[];
  };
  tokenProperties: {
    valid: boolean;
    hostname: string;
    action: string;
    createTime: string;
  };
}

interface RecaptchaConfig {
  projectId: string;
  siteKey: string;
  action: string;
  threshold: number; // Risk threshold (0.0 to 1.0)
}

const DEFAULT_CONFIG: RecaptchaConfig = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'servesa-aad53',
  siteKey: process.env.RECAPTCHA_SITE_KEY || '',
  action: 'servesa_action',
  threshold: 0.5 // Medium risk threshold
};

export class RecaptchaEnterprise {
  private client: RecaptchaEnterpriseServiceClient;
  private config: RecaptchaConfig;

  constructor(config: Partial<RecaptchaConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = new RecaptchaEnterpriseServiceClient();
  }

  async assessToken(token: string, action?: string): Promise<{
    score: number;
    riskLevel: 'low' | 'medium' | 'high';
    reasons: string[];
    shouldFlag: boolean;
    assessment: RecaptchaAssessment;
  }> {
    try {
      const formattedName = this.client.projectPath(this.config.projectId);
      
      const request = {
        parent: formattedName,
        assessment: {
          event: {
            token: token,
            siteKey: this.config.siteKey,
            expectedAction: action || this.config.action
          }
        }
      };

      const [response] = await this.client.createAssessment(request);
      const assessment = response as any;

      if (!assessment.riskAnalysis) {
        throw new Error('No risk analysis in assessment response');
      }

      const score = assessment.riskAnalysis.score;
      const reasons = assessment.riskAnalysis.reasons || [];

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high';
      if (score >= 0.7) {
        riskLevel = 'low';
      } else if (score >= 0.3) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'high';
      }

      // Flag if score is below threshold
      const shouldFlag = score < this.config.threshold;

      return {
        score,
        riskLevel,
        reasons,
        shouldFlag,
        assessment
      };

    } catch (error) {
      console.error('reCAPTCHA assessment failed:', error);
      
      // Return default assessment on error (flag for manual review)
      return {
        score: 0.0,
        riskLevel: 'high',
        reasons: ['assessment_error'],
        shouldFlag: true,
        assessment: {
          riskAnalysis: { score: 0.0, reasons: ['assessment_error'] },
          tokenProperties: { valid: false, hostname: '', action: '', createTime: '' }
        }
      };
    }
  }

  async assessRequest(req: any, action?: string): Promise<{
    score: number;
    riskLevel: 'low' | 'medium' | 'high';
    shouldFlag: boolean;
    token?: string;
  }> {
    const token = req.headers['x-recaptcha-token'] || 
                  req.body?.recaptchaToken || 
                  req.query?.recaptchaToken;

    if (!token) {
      return {
        score: 0.0,
        riskLevel: 'high',
        shouldFlag: true
      };
    }

    const result = await this.assessToken(token, action);
    
    return {
      score: result.score,
      riskLevel: result.riskLevel,
      shouldFlag: result.shouldFlag,
      token
    };
  }

  // Log assessment for monitoring (no blocking)
  logAssessment(assessment: any, context: string): void {
    console.log(`reCAPTCHA Assessment [${context}]:`, {
      score: assessment.score,
      riskLevel: assessment.riskLevel,
      shouldFlag: assessment.shouldFlag,
      timestamp: new Date().toISOString(),
      action: context
    });
  }

  // Check if reCAPTCHA is enabled
  isEnabled(): boolean {
    return !!this.config.siteKey && this.config.siteKey.length > 0;
  }
}

// Pre-configured instances for different actions
export const recaptchaCaseCreation = new RecaptchaEnterprise({
  action: 'case_creation',
  threshold: 0.4 // Stricter for case creation
});

export const recaptchaAuth = new RecaptchaEnterprise({
  action: 'authentication',
  threshold: 0.3 // Stricter for authentication
});

export const recaptchaGeneral = new RecaptchaEnterprise({
  action: 'general',
  threshold: 0.5 // Default threshold
});

// Middleware function for Cloud Functions
export function withRecaptcha(
  recaptchaInstance: RecaptchaEnterprise,
  getAction?: (req: any) => string
) {
  return (handler: Function) => {
    return async (req: any, res: any) => {
      if (!recaptchaInstance.isEnabled()) {
        // Skip reCAPTCHA if not configured
        return handler(req, res);
      }

      const action = getAction ? getAction(req) : undefined;
      const assessment = await recaptchaInstance.assessRequest(req, action);
      
      // Log assessment (flag-only, no blocking)
      recaptchaInstance.logAssessment(assessment, action || 'unknown');

      // Add assessment headers for monitoring
      res.set({
        'X-Recaptcha-Score': assessment.score.toString(),
        'X-Recaptcha-Risk': assessment.riskLevel,
        'X-Recaptcha-Flagged': assessment.shouldFlag.toString()
      });

      return handler(req, res);
    };
  };
}
