let API_URL = "http://localhost:5000";

if (typeof process !== "undefined" && process.env && process.env.API_URL) {
  API_URL = process.env.API_URL;
} else if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) {
  API_URL = import.meta.env.VITE_API_URL;
}

export async function apiGet(endpoint: string) {
  // Add a cache-buster to bypass any aggressive browser caching
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `${API_URL}${endpoint}${separator}_t=${Date.now()}`;
  
  const res = await fetch(url, {
    headers: { 
      "Accept": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  });
  if (!res.ok) throw new Error(`API GET error: ${res.statusText}`);
  return res.json();
}

export async function apiPost(endpoint: string, body: any) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`API POST error: ${res.statusText}`);
  return res.json();
}
