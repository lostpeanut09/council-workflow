
async function getGhcrDigest() {
  const tokenRes = await fetch("https://ghcr.io/token?scope=repository:github/github-mcp-server:pull");
  const tokenData = await tokenRes.json();
  const res = await fetch("https://ghcr.io/v2/github/github-mcp-server/manifests/latest", {
    method: "HEAD",
    headers: {
      Authorization: `Bearer ${tokenData.token}`,
      Accept: "application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.docker.distribution.manifest.v2+json"
    }
  });
  return res.headers.get("docker-content-digest");
}

async function getDockerHubDigest() {
  const tokenRes = await fetch("https://auth.docker.io/token?service=registry.docker.io&scope=repository:mcp/playwright:pull");
  const tokenData = await tokenRes.json();
  const res = await fetch("https://registry-1.docker.io/v2/mcp/playwright/manifests/latest", {
    method: "HEAD",
    headers: {
      Authorization: `Bearer ${tokenData.token}`,
      Accept: "application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.docker.distribution.manifest.v2+json"
    }
  });
  return res.headers.get("docker-content-digest");
}

async function main() {
  console.log("ghcr: " + await getGhcrDigest());
  console.log("docker: " + await getDockerHubDigest());
}
main().catch(console.error);

