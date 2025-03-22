# API Endpoint Consolidation

This document describes the recent consolidation of API endpoints to reduce redundancy and improve maintainability.

## Consolidated Endpoints

### Script Analysis Endpoints

The script analysis functionality has been consolidated into a single endpoint:

- **Primary endpoint:** `/api/writer/scripts/analyze`
- **Deprecated:** `/api/ai/analyze` (functionality merged into primary endpoint)

The consolidated `/api/writer/scripts/analyze` endpoint now supports:
1. Direct content analysis (for scripts not yet saved)
2. Analysis by script ID (for already saved scripts)

#### Usage Examples:

**For direct content analysis:**
```json
POST /api/writer/scripts/analyze
{
  "content": "Script content here...",
  "projectId": "required-project-id",
  "title": "Script Title",
  "logline": "Script logline",
  "synopsis": "Script synopsis",
  "genre": "Script genre",
  "targetAudience": "Target audience"
}
```

**For script ID-based analysis:**
```json
POST /api/writer/scripts/analyze
{
  "script_id": "script_123456",
  "bypass_cache": false
}
```

### Script Submission Model

- **Primary endpoint:** `/api/submissions` - Used for all script submissions to projects
- **Deprecated:** `/api/scripts` - No longer used as all scripts must be linked to projects

All scripts must now be submitted to specific projects. Standalone scripts are no longer supported in the platform.

### Synopsis Generation

- `/api/ai/synopsis`: Generates synopses for scripts (for project submissions)

## Best Practices

1. Always use the primary consolidated endpoints
2. Ensure project IDs are provided with all script submissions
3. Ensure proper authentication headers are included with all requests
4. Be mindful of rate limits for AI-intensive operations

## Updating Client Code

If you're using the deprecated endpoints in client code, update your API calls to use the consolidated endpoints as shown above. 