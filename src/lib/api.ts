// Use environment variable if available, otherwise fallback to localhost
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const CLEAN_BASE_URL = BASE_URL.replace(/\/$/, "");

export const API_BASE_URL = `${CLEAN_BASE_URL}/api`;
export const WS_BASE_URL = `${CLEAN_BASE_URL.replace(/^http/, "ws")}/ws`;

export async function uploadVideo(file: File, frameSkip: number = 15): Promise<{ id: string; status: string; frame_skip: number }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/upload/video?frame_skip=${frameSkip}`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Upload failed");
    }

    return response.json();
}

export async function getVideoStatus(fileId: string) {
    const response = await fetch(`${API_BASE_URL}/upload/${fileId}/status`);
    if (!response.ok) {
        throw new Error("Failed to get status");
    }
    return response.json();
}

// Threat Analysis APIs
export interface ThreatAnalysisRequest {
    youtube_url?: string;
    threat_types: string[];
    frame_skip?: number;
    testing_mode?: boolean;
}

export interface ThreatAlert {
    id: string;
    threat_type: string;
    confidence: number;
    location: string;
    timestamp: number;
    status: string;
    screenshot_b64?: string;
    created_at: string;
    metadata?: any;
}

export async function analyzeThreat(
    source: 'youtube' | 'upload',
    data: ThreatAnalysisRequest | FormData
): Promise<{ id: string; status: string }> {
    let response;

    if (source === 'youtube') {
        response = await fetch(`${API_BASE_URL}/threat/analyze/youtube`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
    } else {
        // FormData for upload
        response = await fetch(`${API_BASE_URL}/threat/analyze?threat_types=${(data as FormData).getAll('threat_types')}`, {
            method: "POST",
            body: data as FormData,
        });
    }

    if (!response.ok) {
        throw new Error("Analysis failed");
    }
    return response.json();
}

export async function getThreatAlerts(
    limit: number = 50,
    threatType?: string
): Promise<{ alerts: ThreatAlert[]; total: number; stats: any }> {
    const url = new URL(`${API_BASE_URL}/threat/alerts`);
    url.searchParams.append("limit", limit.toString());
    if (threatType) url.searchParams.append("threat_type", threatType);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error("Failed to get alerts");
    return response.json();
}
