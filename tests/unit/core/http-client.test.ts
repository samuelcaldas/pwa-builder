import { describe, it, expect, vi } from "vitest";
import { FetchHttpClient, MockHttpClient } from "../../../src/core/http-client.js";
import { NetworkError } from "../../../src/core/errors.js";

describe("HttpClient Abstractions", () => {
  describe("MockHttpClient", () => {
    it("should return configured JSON response", async () => {
      const mockClient = new MockHttpClient();
      mockClient.onGet("https://api.test/data", {
        status: 200,
        statusText: "OK",
        data: { message: "success" }
      });

      const response = await mockClient.request<{ message: string }>({
        url: "https://api.test/data",
        method: "GET"
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ message: "success" });
    });

    it("should throw NetworkError when configured to fail", async () => {
      const mockClient = new MockHttpClient();
      mockClient.onPost("https://api.test/submit", {
        status: 500,
        statusText: "Internal Server Error",
        data: "Database failed"
      });

      await expect(
        mockClient.request({
          url: "https://api.test/submit",
          method: "POST"
        })
      ).rejects.toThrow(NetworkError);
    });

    it("should record request history for assertion", async () => {
      const mockClient = new MockHttpClient();
      mockClient.onPost("https://api.test/upload", {
        status: 200,
        statusText: "OK",
        data: "uploaded"
      });

      await mockClient.request({
        url: "https://api.test/upload",
        method: "POST",
        body: JSON.stringify({ item: 1 }),
        headers: { "Content-Type": "application/json" }
      });

      const history = mockClient.getRequestHistory();
      expect(history).toHaveLength(1);
      expect(history[0]?.url).toBe("https://api.test/upload");
      expect(history[0]?.method).toBe("POST");
    });
  });

  describe("FetchHttpClient", () => {
    it("should execute fetch and return parsed JSON", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ score: 100 })
      });

      const client = new FetchHttpClient(mockFetch as unknown as typeof fetch);
      const response = await client.request<{ score: number }>({
        url: "https://api.test/score",
        method: "GET"
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ score: 100 });
      expect(mockFetch).toHaveBeenCalledWith("https://api.test/score", expect.any(Object));
    });

    it("should throw NetworkError on non-ok status", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: new Headers(),
        text: async () => "Not found content"
      });

      const client = new FetchHttpClient(mockFetch as unknown as typeof fetch);
      await expect(
        client.request({
          url: "https://api.test/missing",
          method: "GET"
        })
      ).rejects.toThrow(NetworkError);
    });
  });
});
