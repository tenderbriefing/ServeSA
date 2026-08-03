# ServeSA Official Portal Playbook
## Operational Guide for Municipal Staff

**Version:** 1.0  
**Last Updated:** [DATE]  
**Applicable to:** Municipal Service Delivery Staff  
**Platform:** ServeSA National Service Delivery Platform

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [User Roles and Permissions](#2-user-roles-and-permissions)
3. [Case Management Workflows](#3-case-management-workflows)
4. [Queue Management](#4-queue-management)
5. [Status Transitions](#5-status-transitions)
6. [Evidence Management](#6-evidence-management)
7. [Communication Protocols](#7-communication-protocols)
8. [Reporting and Analytics](#8-reporting-and-analytics)
9. [Troubleshooting](#9-troubleshooting)
10. [Best Practices](#10-best-practices)

---

## 1. Getting Started

### 1.1 Platform Access
- **URL:** https://servesa.gov.za/dashboard
- **Login:** Use your municipal email address
- **Authentication:** Google OAuth or email/password
- **Support:** Contact your municipal IT department for access issues

### 1.2 First-Time Setup
1. Navigate to the dashboard URL
2. Click "Sign In" and use your municipal email
3. Complete your profile with department and contact information
4. Review and accept the terms of service
5. Set up notification preferences

### 1.3 Dashboard Overview
- **Cases Queue:** Pending cases requiring attention
- **My Cases:** Cases assigned to you
- **Analytics:** Performance metrics and trends
- **Settings:** Profile and notification preferences

---

## 2. User Roles and Permissions

### 2.1 Role Types

#### Case Manager
- **Responsibilities:** Primary case handling and resolution
- **Permissions:** View, update, and resolve cases
- **Access:** Full case details and history

#### Supervisor
- **Responsibilities:** Oversight and quality assurance
- **Permissions:** All case manager permissions plus reassignment
- **Access:** Team performance analytics

#### Administrator
- **Responsibilities:** System configuration and user management
- **Permissions:** Full system access and configuration
- **Access:** All features and administrative tools

### 2.2 Permission Matrix

| Feature | Case Manager | Supervisor | Administrator |
|---------|-------------|------------|---------------|
| View Cases | ✅ | ✅ | ✅ |
| Update Cases | ✅ | ✅ | ✅ |
| Reassign Cases | ❌ | ✅ | ✅ |
| View Analytics | Limited | ✅ | ✅ |
| User Management | ❌ | ❌ | ✅ |
| System Settings | ❌ | ❌ | ✅ |

---

## 3. Case Management Workflows

### 3.1 Case Lifecycle

#### 1. Case Creation
- Resident submits report via mobile app or web
- System automatically assigns ward and municipality
- Case appears in queue with priority level

#### 2. Case Assignment
- Supervisor reviews and assigns to appropriate staff
- Case manager receives notification
- Case moves to "Assigned" status

#### 3. Initial Response
- Case manager acknowledges receipt within SLA timeframe
- Send initial response to resident
- Update case status to "In Progress"

#### 4. Investigation
- Visit site if required
- Assess scope and complexity
- Upload photos and documentation
- Update case with findings

#### 5. Resolution
- Complete required work
- Update case with resolution details
- Mark case as "Resolved"
- Send completion notification to resident

### 3.2 Priority Levels

#### Emergency (Red)
- **Response Time:** 1 hour acknowledgment, 4 hours initial response
- **Examples:** Water main breaks, electrical hazards, road collapses
- **Escalation:** Immediate supervisor notification

#### High (Orange)
- **Response Time:** 2 hours acknowledgment, 24 hours initial response
- **Examples:** Water leaks, power outages, major potholes
- **Escalation:** Daily supervisor review

#### Medium (Yellow)
- **Response Time:** 24 hours acknowledgment, 72 hours initial response
- **Examples:** Minor repairs, routine maintenance, general inquiries
- **Escalation:** Weekly review

#### Low (Green)
- **Response Time:** 48 hours acknowledgment, 1 week initial response
- **Examples:** Information requests, minor issues, future planning
- **Escalation:** Monthly review

---

## 4. Queue Management

### 4.1 Queue Views

#### My Queue
- Cases assigned to you
- Sorted by priority and creation date
- Shows SLA countdown timers

#### Team Queue
- All cases in your department
- Filter by status, priority, and category
- Bulk assignment capabilities

#### Overdue Cases
- Cases exceeding SLA timeframes
- Automatic highlighting and alerts
- Escalation procedures

### 4.2 Queue Filters

#### By Status
- **New:** Recently created cases
- **Assigned:** Cases assigned to staff
- **In Progress:** Active work cases
- **Pending:** Waiting for information or resources
- **Resolved:** Completed cases

#### By Category
- **Water:** Water supply and sanitation issues
- **Electricity:** Power and electrical problems
- **Roads:** Road maintenance and infrastructure
- **Waste:** Garbage collection and disposal
- **Internet:** Telecommunications issues
- **Emergency:** Urgent safety concerns

#### By Priority
- **Emergency:** Immediate attention required
- **High:** Urgent but not life-threatening
- **Medium:** Standard priority
- **Low:** Non-urgent issues

### 4.3 Queue Actions

#### Bulk Operations
- Select multiple cases
- Bulk assign to team members
- Bulk status updates
- Export case data

#### Quick Actions
- **Acknowledge:** Send immediate response
- **Reassign:** Transfer to different staff member
- **Escalate:** Move to higher priority
- **Request Info:** Ask resident for additional details

---

## 5. Status Transitions

### 5.1 Status Types

#### New
- **Description:** Case created, awaiting assignment
- **Actions:** Assign to appropriate staff member
- **SLA:** Assignment within 2 hours

#### Assigned
- **Description:** Case assigned to staff member
- **Actions:** Acknowledge receipt and begin work
- **SLA:** Acknowledgment within priority timeframe

#### In Progress
- **Description:** Active work being performed
- **Actions:** Update progress and communicate with resident
- **SLA:** Regular updates every 48 hours

#### Pending
- **Description:** Waiting for information or resources
- **Actions:** Request additional information or resources
- **SLA:** Resolution of pending items within 72 hours

#### Resolved
- **Description:** Work completed successfully
- **Actions:** Confirm completion with resident
- **SLA:** Final communication within 24 hours

#### Closed
- **Description:** Case fully closed and archived
- **Actions:** No further action required
- **SLA:** Closure within 7 days of resolution

### 5.2 Status Update Procedures

#### Required Information
- **Status Change:** Select new status from dropdown
- **Comments:** Provide detailed update on progress
- **Photos:** Upload relevant images (if applicable)
- **Next Steps:** Outline planned actions
- **Timeline:** Provide estimated completion date

#### Communication
- **Resident Notification:** Automatic email/SMS sent
- **Internal Notes:** Visible to team members only
- **Escalation:** Automatic alerts for overdue cases

---

## 6. Evidence Management

### 6.1 Photo Requirements

#### Before Photos
- **Purpose:** Document initial condition
- **Requirements:** Clear, well-lit images showing full scope
- **Quantity:** Minimum 2-3 photos from different angles
- **Metadata:** Include GPS coordinates and timestamp

#### During Photos
- **Purpose:** Document work progress
- **Requirements:** Show work being performed
- **Quantity:** Regular updates throughout process
- **Metadata:** Include worker identification if applicable

#### After Photos
- **Purpose:** Document completed work
- **Requirements:** Same angles as before photos
- **Quantity:** Minimum 2-3 photos showing completion
- **Metadata:** Include completion timestamp

### 6.2 Document Upload

#### Supported Formats
- **Images:** JPG, PNG, GIF (max 10MB each)
- **Documents:** PDF, DOC, DOCX (max 25MB each)
- **Videos:** MP4, MOV (max 100MB each)

#### Upload Guidelines
- **Naming:** Use descriptive filenames
- **Organization:** Group related files together
- **Privacy:** Ensure no personal information in images
- **Quality:** Ensure files are clear and readable

### 6.3 Evidence Review

#### Quality Checklist
- [ ] Images are clear and well-lit
- [ ] Full scope of issue is visible
- [ ] Before/after comparison is possible
- [ ] No personal information exposed
- [ ] Files are properly named
- [ ] GPS coordinates are accurate

#### Supervisor Review
- **Frequency:** Weekly review of evidence quality
- **Focus:** Compliance with guidelines
- **Feedback:** Provide guidance for improvement
- **Training:** Identify training needs

---

## 7. Communication Protocols

### 7.1 Resident Communication

#### Initial Response
- **Timing:** Within SLA acknowledgment timeframe
- **Content:** Confirm receipt and outline next steps
- **Tone:** Professional and reassuring
- **Language:** Use resident's preferred language

#### Progress Updates
- **Frequency:** Every 48 hours for active cases
- **Content:** Current status and estimated completion
- **Tone:** Informative and professional
- **Language:** Clear and non-technical

#### Completion Notification
- **Timing:** Within 24 hours of resolution
- **Content:** Confirm completion and request feedback
- **Tone:** Professional and helpful
- **Language:** Thank resident for patience

### 7.2 Internal Communication

#### Team Updates
- **Frequency:** Daily standup meetings
- **Content:** Case status and resource needs
- **Format:** Brief, focused updates
- **Documentation:** Record decisions and actions

#### Supervisor Reports
- **Frequency:** Weekly summary reports
- **Content:** Performance metrics and issues
- **Format:** Structured report template
- **Action:** Address identified issues

#### Escalation Procedures
- **Triggers:** SLA breaches, complex cases, resource shortages
- **Process:** Immediate notification to supervisor
- **Documentation:** Record escalation reason and actions
- **Follow-up:** Regular updates until resolution

### 7.3 Communication Templates

#### Acknowledgment Template
```
Dear [Resident Name],

Thank you for reporting [issue description] in [location]. We have received your report and assigned it to our team for investigation.

Case ID: [CASE-ID]
Priority: [PRIORITY-LEVEL]
Estimated Response: [TIMEFRAME]

Our team will begin work on this issue and provide regular updates on progress. You will receive notifications at key milestones.

If you have any questions, please reply to this message or contact us at [contact information].

Best regards,
[Your Name]
[Department]
```

#### Progress Update Template
```
Dear [Resident Name],

This is an update on your case [CASE-ID] regarding [issue description].

Current Status: [STATUS]
Progress Made: [DETAILS]
Next Steps: [PLANNED-ACTIONS]
Estimated Completion: [DATE]

[Additional relevant information]

Thank you for your patience.

Best regards,
[Your Name]
[Department]
```

---

## 8. Reporting and Analytics

### 8.1 Performance Metrics

#### Individual Metrics
- **Cases Handled:** Total cases assigned and resolved
- **Response Time:** Average time to first response
- **Resolution Time:** Average time to complete resolution
- **SLA Compliance:** Percentage of cases meeting SLA targets
- **Customer Satisfaction:** Average satisfaction scores

#### Team Metrics
- **Team Performance:** Aggregate team statistics
- **Workload Distribution:** Cases per team member
- **Quality Metrics:** Evidence quality and completeness
- **Efficiency Trends:** Performance over time

#### Department Metrics
- **Volume Trends:** Case volume by category and time period
- **Resource Utilization:** Staff allocation and workload
- **Cost Analysis:** Cost per case and efficiency metrics
- **Impact Assessment:** Service delivery improvements

### 8.2 Report Types

#### Daily Reports
- **Purpose:** Operational monitoring
- **Content:** New cases, resolved cases, overdue items
- **Audience:** Team members and supervisors
- **Format:** Brief summary with key metrics

#### Weekly Reports
- **Purpose:** Performance review and planning
- **Content:** Detailed metrics and trend analysis
- **Audience:** Supervisors and managers
- **Format:** Comprehensive report with charts

#### Monthly Reports
- **Purpose:** Strategic analysis and reporting
- **Content:** Long-term trends and recommendations
- **Audience:** Department leadership and stakeholders
- **Format:** Executive summary with detailed analysis

### 8.3 Analytics Dashboard

#### Key Performance Indicators
- **Case Volume:** Total cases by time period
- **Response Times:** Average response times by priority
- **Resolution Rates:** Percentage of cases resolved
- **SLA Compliance:** Overall SLA performance
- **Customer Satisfaction:** Average satisfaction scores

#### Trend Analysis
- **Seasonal Patterns:** Case volume by season
- **Category Trends:** Issues by service category
- **Geographic Distribution:** Cases by ward/area
- **Performance Trends:** Improvement over time

#### Predictive Analytics
- **Demand Forecasting:** Expected case volume
- **Resource Planning:** Staff allocation needs
- **Risk Assessment:** Potential SLA breaches
- **Optimization Opportunities:** Process improvements

---

## 9. Troubleshooting

### 9.1 Common Issues

#### Technical Problems
- **Login Issues:** Clear browser cache, check credentials
- **Slow Performance:** Check internet connection, close other tabs
- **Upload Failures:** Check file size and format requirements
- **Notification Problems:** Verify email and phone settings

#### Workflow Issues
- **Case Assignment:** Contact supervisor for reassignment
- **Status Updates:** Ensure all required fields are completed
- **Communication:** Check resident contact information
- **SLA Breaches:** Escalate immediately to supervisor

#### Data Issues
- **Missing Information:** Request additional details from resident
- **Incorrect Location:** Verify GPS coordinates and address
- **Duplicate Cases:** Merge or close duplicate entries
- **Data Export:** Contact IT support for assistance

### 9.2 Support Resources

#### Self-Service
- **Help Documentation:** Built-in help system
- **Video Tutorials:** Step-by-step guidance
- **FAQ Database:** Common questions and answers
- **Best Practices:** Guidelines and tips

#### Technical Support
- **IT Help Desk:** Technical issues and access problems
- **Platform Support:** ServeSA technical team
- **Training Team:** Workflow and process questions
- **Supervisor Support:** Operational guidance

#### Escalation Path
1. **Self-Service:** Check help documentation first
2. **Team Lead:** Ask experienced team members
3. **Supervisor:** Escalate complex issues
4. **IT Support:** Technical problems
5. **Platform Support:** ServeSA team for system issues

### 9.3 Problem Resolution

#### Issue Documentation
- **Description:** Clear description of the problem
- **Steps to Reproduce:** How to recreate the issue
- **Expected vs Actual:** What should happen vs what happened
- **Screenshots:** Visual evidence of the problem
- **Impact:** How the issue affects work

#### Resolution Tracking
- **Issue ID:** Unique identifier for tracking
- **Status Updates:** Regular updates on progress
- **Resolution Steps:** Actions taken to resolve
- **Prevention:** Steps to prevent recurrence
- **Knowledge Base:** Add to help documentation

---

## 10. Best Practices

### 10.1 Case Management

#### Efficient Workflow
- **Prioritize Cases:** Focus on high-priority items first
- **Batch Similar Work:** Group related cases together
- **Use Templates:** Standardize common responses
- **Regular Updates:** Keep residents informed of progress

#### Quality Assurance
- **Thorough Investigation:** Visit site when necessary
- **Complete Documentation:** Upload all relevant evidence
- **Clear Communication:** Use simple, clear language
- **Follow-up:** Ensure resident satisfaction

#### Time Management
- **Set Realistic Deadlines:** Account for complexity and resources
- **Regular Reviews:** Monitor progress and adjust timelines
- **Escalate Early:** Don't wait until SLA breach
- **Document Delays:** Record reasons for delays

### 10.2 Communication Excellence

#### Professional Communication
- **Prompt Responses:** Meet or exceed SLA timeframes
- **Clear Language:** Avoid technical jargon
- **Empathetic Tone:** Show understanding of resident concerns
- **Consistent Updates:** Regular progress communication

#### Resident Engagement
- **Active Listening:** Understand resident needs and concerns
- **Proactive Communication:** Anticipate questions and provide updates
- **Follow-up:** Ensure resolution meets expectations
- **Feedback Collection:** Gather input for improvement

#### Team Collaboration
- **Share Knowledge:** Document lessons learned
- **Support Colleagues:** Help team members when needed
- **Regular Meetings:** Participate in team discussions
- **Best Practice Sharing:** Contribute to team improvement

### 10.3 Continuous Improvement

#### Performance Monitoring
- **Track Metrics:** Monitor personal performance regularly
- **Identify Trends:** Look for patterns in case types and issues
- **Set Goals:** Establish improvement targets
- **Seek Feedback:** Ask for input from supervisors and residents

#### Skill Development
- **Training Participation:** Attend relevant training sessions
- **Skill Building:** Develop technical and soft skills
- **Mentorship:** Learn from experienced colleagues
- **Certification:** Pursue relevant certifications

#### Process Improvement
- **Suggest Improvements:** Identify opportunities for enhancement
- **Document Issues:** Record problems and potential solutions
- **Participate in Reviews:** Contribute to process evaluations
- **Implement Changes:** Adopt new procedures and tools

---

## Appendices

### Appendix A: Quick Reference Guide
- Common keyboard shortcuts
- Status codes and meanings
- SLA timeframes by priority
- Contact information

### Appendix B: Templates and Forms
- Communication templates
- Report formats
- Checklist templates
- Quality assurance forms

### Appendix C: Troubleshooting Guide
- Common problems and solutions
- Error messages and meanings
- Support contact information
- Escalation procedures

### Appendix D: Training Resources
- Video tutorials
- User guides
- Best practice documents
- Certification programs
