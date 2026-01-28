export const API_BASE_URL = "http://localhost:8000/api";
export const WS_BASE_URL = "ws://localhost:8000/ws";

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
