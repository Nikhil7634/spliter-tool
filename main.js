let originalImage = null;
let splitImages = [];

function toggleMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  menu.classList.toggle("hidden");
}

function toggleFAQ(index) {
  const content = document.getElementById(`faq-content-${index}`);
  const icon = document.getElementById(`faq-icon-${index}`);

  content.classList.toggle("open");
  icon.classList.toggle("rotate-180");
}

document.getElementById("upload-area").addEventListener("click", () => {
  document.getElementById("image-input").click();
});

document.getElementById("upload-area").addEventListener("dragover", (e) => {
  e.preventDefault();
  e.currentTarget.classList.add("drag-over");
});

document.getElementById("upload-area").addEventListener("dragleave", (e) => {
  e.preventDefault();
  e.currentTarget.classList.remove("drag-over");
});

document.getElementById("upload-area").addEventListener("drop", (e) => {
  e.preventDefault();
  e.currentTarget.classList.remove("drag-over");

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleImageUpload(files[0]);
  }
});

document.getElementById("image-input").addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    handleImageUpload(e.target.files[0]);
  }
});

function handleImageUpload(file) {
  if (!file.type.startsWith("image/")) {
    alert("Please select a valid image file.");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    alert("Please select an image smaller than 10MB.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      originalImage = img;
      document.getElementById("controls").classList.remove("hidden");

      const uploadArea = document.getElementById("upload-area");
      uploadArea.innerHTML = `
                        <div class="relative">
                            <img src="${e.target.result}" class="image-preview mx-auto mb-6">
                            <div class="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                <i class="fas fa-check mr-1"></i>Uploaded
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-700 mb-4">Image Ready to Split!</h3>
                        <p class="text-lg text-gray-600 mb-2">Configure your grid settings below and click "Split Image"</p>
                        <p class="text-sm text-gray-500">Or click here to upload a different image</p>
                    `;

      document
        .getElementById("controls")
        .scrollIntoView({ behavior: "smooth" });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

document.getElementById("rows").addEventListener("change", updatePreview);
document.getElementById("columns").addEventListener("change", updatePreview);

function updatePreview() {
  if (splitImages.length > 0) {
    displaySplitImages();
  }
}

function splitImage() {
  if (!originalImage) {
    alert("Please upload an image first.");
    return;
  }

  const rows = parseInt(document.getElementById("rows").value);
  const columns = parseInt(document.getElementById("columns").value);

  splitImages = [];

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const pieceWidth = originalImage.width / columns;
  const pieceHeight = originalImage.height / rows;

  canvas.width = pieceWidth;
  canvas.height = pieceHeight;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      ctx.clearRect(0, 0, pieceWidth, pieceHeight);
      ctx.drawImage(
        originalImage,
        col * pieceWidth,
        row * pieceHeight,
        pieceWidth,
        pieceHeight,
        0,
        0,
        pieceWidth,
        pieceHeight
      );

      splitImages.push({
        dataUrl: canvas.toDataURL("image/png"),
        row: row,
        col: col,
        filename: `piece_${row + 1}_${col + 1}`,
      });
    }
  }

  displaySplitImages();
  document.getElementById("download-btn").classList.remove("hidden");
}

function displaySplitImages() {
  const rows = parseInt(document.getElementById("rows").value);
  const columns = parseInt(document.getElementById("columns").value);

  const previewSection = document.getElementById("preview-section");
  const gridPreview = document.getElementById("grid-preview");

  gridPreview.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  gridPreview.innerHTML = "";

  splitImages.forEach((piece, index) => {
    const gridItem = document.createElement("div");
    gridItem.className = "grid-item";
    gridItem.innerHTML = `
                    <img src="${piece.dataUrl}" alt="Grid piece ${index + 1}">
                    <i class="fas fa-download download-icon"></i>
                `;

    gridItem.addEventListener("click", () => downloadSingle(piece));
    gridPreview.appendChild(gridItem);
  });

  previewSection.classList.remove("hidden");
  document.getElementById("download-btn").classList.remove("hidden");
  document.getElementById("download-zip-btn").classList.remove("hidden");
  previewSection.scrollIntoView({ behavior: "smooth" });
}

function downloadSingle(piece) {
  const format = document.getElementById("format").value;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const mimeType =
      format === "jpg" || format === "jpeg" ? "image/jpeg" : `image/${format}`;
    const dataUrl = canvas.toDataURL(mimeType, 0.9);

    const link = document.createElement("a");
    link.download = `${piece.filename}.${format}`;
    link.href = dataUrl;
    link.click();
  };

  img.src = piece.dataUrl;
}

function downloadAll() {
  if (splitImages.length === 0) {
    alert("Please split an image first.");
    return;
  }

  const format = document.getElementById("format").value;

  splitImages.forEach((piece, index) => {
    setTimeout(() => {
      downloadSingle(piece);
    }, index * 200);
  });
}

async function downloadAllAsZip() {
  if (splitImages.length === 0) {
    alert("Please split an image first.");
    return;
  }

  const format = document.getElementById("format").value;
  const zip = new JSZip();

  const zipBtn = document.getElementById("download-zip-btn");
  const originalText = zipBtn.innerHTML;
  zipBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin mr-3"></i>Creating ZIP...';
  zipBtn.disabled = true;

  try {
    for (let i = 0; i < splitImages.length; i++) {
      const piece = splitImages[i];
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      await new Promise((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const mimeType =
            format === "jpg" || format === "jpeg"
              ? "image/jpeg"
              : `image/${format}`;
          canvas.toBlob(
            (blob) => {
              zip.file(`${piece.filename}.${format}`, blob);
              resolve();
            },
            mimeType,
            0.9
          );
        };
        img.src = piece.dataUrl;
      });
    }

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = `instagram-grid-${Date.now()}.zip`;
    link.click();

    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Error creating ZIP:", error);
    alert("Error creating ZIP file. Please try downloading individual files.");
  } finally {
    zipBtn.innerHTML = originalText;
    zipBtn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const animatedElements = document.querySelectorAll(".animate-slide-up");
  animatedElements.forEach((el) => {
    setTimeout(() => {
      el.style.opacity = "1";
    }, 100);
  });
});
