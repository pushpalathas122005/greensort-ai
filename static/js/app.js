document.addEventListener("DOMContentLoaded", () => {
  const menu = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (menu && nav) menu.addEventListener("click", () => nav.classList.toggle("nav-open"));

  document.querySelectorAll("[data-dismiss]").forEach(btn => btn.addEventListener("click", () => btn.closest(".flash")?.remove()));

  const fileInput = document.querySelector("[data-image-input]");
  const preview = document.querySelector("[data-image-preview]");
  if (fileInput && preview) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) { preview.classList.add("hidden"); preview.removeAttribute("src"); return; }
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) {
        alert("Choose a JPG, PNG, or WEBP image smaller than 5 MB.");
        fileInput.value = ""; preview.classList.add("hidden"); return;
      }
      preview.src = URL.createObjectURL(file);
      preview.classList.remove("hidden");
    });
  }

  document.querySelectorAll("[data-fill]").forEach(btn => btn.addEventListener("click", () => {
    const field = document.querySelector(".text-panel textarea");
    if (field) { field.value = btn.dataset.fill; field.focus(); }
  }));

  document.querySelectorAll("form[data-confirm]").forEach(form => form.addEventListener("submit", e => {
    if (!confirm(form.dataset.confirm)) e.preventDefault();
  }));

  const copyBtn = document.querySelector("[data-copy-invite]");
  const shareBtn = document.querySelector("[data-share-invite]");
  const invite = document.querySelector("#invite-link");
  const status = document.querySelector("[data-share-status]");
  const inviteText = "Join me on GreenSort AI and learn better ways to sort waste!";
  if (copyBtn && invite) copyBtn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(invite.value); if(status) status.textContent = "Invitation link copied."; }
    catch { invite.select(); try { document.execCommand("copy"); if(status) status.textContent = "Invitation link copied."; } catch { if(status) status.textContent = "Copy is unavailable. Select and copy the link manually."; } }
  });
  if (shareBtn && invite) shareBtn.addEventListener("click", async () => {
    if (navigator.share) {
      try { await navigator.share({title:"GreenSort AI", text:inviteText, url:invite.value}); if(status) status.textContent = "Share sheet opened."; }
      catch (err) { if (err.name !== "AbortError" && status) status.textContent = "Sharing did not complete. You can copy the link instead."; }
    } else if (status) status.textContent = "Native sharing is not supported here. Use Copy link instead.";
  });

  const qrStart = document.querySelector("[data-start-qr]");
  const qrReader = document.querySelector("#qr-reader");
  const qrResult = document.querySelector("#qr-result");
  let scanner = null;
  if (qrStart && qrReader && qrResult) qrStart.addEventListener("click", async () => {
    if (!window.Html5Qrcode) {
      qrResult.textContent = "QR scanner library did not load. Check your internet connection and reload.";
      return;
    }
    if (scanner) {
      try { await scanner.stop(); } catch {}
      scanner = null; qrReader.classList.add("hidden"); qrStart.textContent = "Open scanner"; return;
    }
    qrReader.classList.remove("hidden"); qrResult.textContent = "Allow camera access when prompted. Point it at a GreenSort demo QR code.";
    scanner = new Html5Qrcode("qr-reader");
    qrStart.textContent = "Stop scanner";
    try {
      await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 220, height: 220 } },
        async decodedText => {
          try { await scanner.stop(); } catch {}
          scanner = null; qrStart.textContent = "Open scanner";
          const token = document.querySelector('meta[name="csrf-token"]')?.content;
          try {
            const response = await fetch(`/api/qr-info?value=${encodeURIComponent(decodedText)}`, {headers: {"X-CSRFToken": token || ""}});
            const data = await response.json();
            qrResult.textContent = data.supported
              ? `${data.name} — ${data.category}. Bin: ${data.bin}. Tip: ${data.tips}`
              : data.message;
          } catch { qrResult.textContent = "QR scanned, but we could not retrieve its information. Try again."; }
        },
        () => {}
      );
    } catch (e) {
      qrResult.textContent = "Camera unavailable. Check browser permission and use localhost or HTTPS. You can describe the item instead.";
      qrReader.classList.add("hidden"); scanner = null; qrStart.textContent = "Open scanner";
    }
  });
});
