class ProductInfo extends HTMLElement {
  connectedCallback() {
    this.sectionId = this.dataset.sectionId;
    this.onPopState = this.onPopState.bind(this);
    window.addEventListener("popstate", this.onPopState);
  }

  disconnectedCallback() {
    window.removeEventListener("popstate", this.onPopState);
  }

  async onPopState() {
    const url = `${location.pathname}${location.search}&section_id=${this.sectionId}`;

    try {
      const res = await fetch(url);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const newSection = doc.querySelector(`#MainProduct-${this.sectionId}`);

      if (newSection) {
        this.replaceWith(newSection);
        //  ProductInfo.reinitialize(newSection);
      }
    } catch (err) {
      console.error("Failed to restore state:", err);
    }
  }

  async updateSection(variantId, productPath = null) {
    ProductInfo.updateProductSection(this.sectionId, variantId, productPath);
  }

  static async updateProductSection(sectionId, variantId, productPath = null) {
    const path = productPath || location.pathname;
    const url = `${path}?variant=${variantId}&section_id=${sectionId}`;

    try {
      const res = await fetch(url);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const newSection = doc.querySelector(`#MainProduct-${sectionId}`);

      if (newSection) {
        const currentSection = document.querySelector(
          `#MainProduct-${sectionId}`
        );
        if (currentSection) {
          currentSection.replaceWith(newSection);
          // ProductInfo.reinitialize(newSection);
        }
      }
    } catch (err) {
      console.error("Failed to update section:", err);
    }
  }
  static reinitialize(section) {
    // Reinitialize any gallery or other interactive components
  }
}

class VariantSelector extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.productUrl = this.dataset.url;
    this.sectionId = this.dataset.sectionId;
    this.productInfo = this.closest("product-info");

    this.querySelectorAll('input[type="radio"]').forEach((input) => {
      input.addEventListener("change", () => this.onVariantChange(input));
    });

    this.querySelectorAll(".color-family-link").forEach((link) => {
      link.addEventListener("click", (e) => this.onColorChange(e, link));
    });
  }

  onVariantChange(input) {
    const variantId = input.value;

    this.updateActiveState(input);

    const url = `${this.productUrl}?variant=${variantId}`;
    window.history.replaceState({ variantId }, "", url);

    ProductInfo.updateProductSection(this.sectionId, variantId);
  }

  onColorChange(e, link) {
    if (link.getAttribute("aria-disabled") === "true") {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    const url = link.href;
    window.history.pushState({}, "", url);

    // Extract variant ID and path from URL
    const urlObj = new URL(url);
    const variantId = urlObj.searchParams.get("variant");
    const productPath = urlObj.pathname;

    // Update product info with new product path
    if (this.productInfo && variantId) {
      ProductInfo.updateProductSection(this.sectionId, variantId, productPath);
    }
  }

  updateActiveState(input) {
    const groupName = input.name;
    this.querySelectorAll(`input[name="${groupName}"]`).forEach((i) => {
      const label = i.nextElementSibling;
      if (label) {
        label.classList.toggle("active", i === input);
      }
    });
  }
}

customElements.define("variant-selector", VariantSelector);

class ProductRecommendations extends HTMLElement {
  constructor() {
    super();
    this.swiper = null;
  }

  connectedCallback() {
    this.loadRecommendations();
  }

  disconnectedCallback() {
    if (this.swiper) {
      this.swiper.destroy(true, true);
    }
  }

  async loadRecommendations() {
    fetch(
      `${this.dataset.url}&product_id=${this.dataset.productId}&section_id=${this.dataset.sectionId}`
    )
      .then((response) => response.text())
      .then((text) => {
        const html = document.createElement("div");
        html.innerHTML = text;
        const recommendations = html.querySelector("product-recommendations");

        if (recommendations && recommendations.innerHTML.trim().length) {
          this.innerHTML = recommendations.innerHTML;

          // setTimeout(() => {
          //   this.initSwiper();
          // }, 300);
        } else {
          this.style.display = "none";
        }
      })
      .catch((error) => {
        console.error("Error loading recommendations:", error);
        this.style.display = "none";
      });
  }

  initSwiper() {
    if (typeof Swiper === "undefined") {
      console.warn("Swiper library not loaded");
      return;
    }

    const swiperContainer = this.querySelector(".swiper-container");
    if (!swiperContainer) return;

    if (this.swiper) {
      this.swiper.destroy(true, true);
    }

    this.swiper = new Swiper(swiperContainer, {
      slidesPerView: 1.2,
      spaceBetween: 16,
      grid: {
        rows: 1,
        fill: "row",
      },
      breakpoints: {
        520: {
          slidesPerView: "auto",
          spaceBetween: 20,
          grid: {
            rows: 1,
          },
        },
        1280: {
          slidesPerView: 4,
          spaceBetween: 24,
          grid: {
            rows: 1,
          },
        },
      },
      navigation: {
        nextEl: ".swiper-button-next-custom",
        prevEl: ".swiper-button-prev-custom",
      },
      watchOverflow: true,
    });
  }
}

customElements.define("product-recommendations", ProductRecommendations);

class SwiperCarousel extends HTMLElement {
  constructor() {
    super();
    this.swiper = null;
  }

  connectedCallback() {
    setTimeout(() => {
      this.init();
    }, 100);
  }

  disconnectedCallback() {
    if (this.swiper) {
      this.swiper.destroy(true, true);
    }
  }

  getConfig() {
    const script = this.querySelector(".swiper-config");
    if (!script) return {};

    try {
      return JSON.parse(script.textContent.trim());
    } catch (e) {
      console.error("Invalid JSON config:", e);
      return {};
    }
  }
  init() {
    if (typeof Swiper === "undefined") {
      console.warn("Swiper library not loaded");
      return;
    }

    const swiperContainer = this.querySelector(".swiper-container");

    const config = this.getConfig();

    // Always enforce DOM-bound selectors
    config.navigation = config.navigation?.enabled
      ? {
          nextEl: this.querySelector(".swiper-button-next-custom"),
          prevEl: this.querySelector(".swiper-button-prev-custom"),
        }
      : false;

    config.pagination = config.pagination?.enabled
      ? {
          el: this.querySelector(".swiper-pagination"),
          clickable: true,
        }
      : false;

    if (!swiperContainer) return;
    this.swiper = new Swiper(swiperContainer, config);
  }
}

customElements.define("swiper-carousel", SwiperCarousel);
