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
        console.log("Replaced section with new content from history state.");

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
          const currentHandle =
            currentSection.querySelector("variant-selector")?.dataset.url;
          const newHandle =
            newSection.querySelector("variant-selector")?.dataset.url;

          const isProductChange =
            currentHandle && newHandle && currentHandle !== newHandle;
          if (isProductChange) {
            currentSection.replaceWith(newSection);
            // ProductInfo.reinitialize(newSection);
            const variantSelector =
              newSection.querySelector("variant-selector");
            if (variantSelector && !variantSelector._initialized) {
              variantSelector.connectedCallback();
            }
            console.log("Replaced entire section due to product path change.");
          } else {
            console.log("Updating partial content of the product section.");
            ProductInfo.updatePartialContent(
              currentSection,
              newSection,
              sectionId
            );
          }
        }
      }
    } catch (err) {
      console.error("Failed to update section:", err);
    }
  }

  static updatePartialContent(currentSection, newSection, sectionId) {
    const updateElement = (selector, updateFn = null) => {
      const current = currentSection.querySelector(selector);
      const newEl = newSection.querySelector(selector);

      if (current && newEl) {
        if (updateFn) {
          updateFn(current, newEl);
        } else {
          current.innerHTML = newEl.innerHTML;
        }
      }
    };

    updateElement("[data-price-container]");
    updateElement("[data-inventory-quantity]");

    updateElement(`#product-form-${sectionId}`, (currentForm, newForm) => {
      const hiddenInput = currentForm.querySelector('input[name="id"]');
      const newHiddenInput = newForm.querySelector('input[name="id"]');
      if (hiddenInput && newHiddenInput) {
        hiddenInput.value = newHiddenInput.value;
      }

      const submitBtn = currentForm.querySelector('button[type="submit"]');
      const newSubmitBtn = newForm.querySelector('button[type="submit"]');
      if (submitBtn && newSubmitBtn) {
        const btnText = submitBtn.querySelector("[data-atc-text]");
        const newBtnText = newSubmitBtn.querySelector("[data-atc-text]");

        if (newSubmitBtn.hasAttribute("disabled")) {
          submitBtn.setAttribute("disabled", "disabled");
          submitBtn.classList.add("button--disabled");
        } else {
          submitBtn.removeAttribute("disabled");
          submitBtn.classList.remove("button--disabled");
        }

        if (btnText && newBtnText) {
          btnText.textContent = newBtnText.textContent;
        }
      }
    });
  }
  static reinitialize(section) {
    // Reinitialize any gallery or other interactive components
  }
}

customElements.define("product-info", ProductInfo);

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

    const urlObj = new URL(url);
    const variantId = urlObj.searchParams.get("variant");
    const productPath = urlObj.pathname;

    if (variantId) {
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
    // setTimeout(() => {
    //   this.init();
    // }, 100);
    if (this._initialized) return;
    this._initialized = true;
    requestAnimationFrame(() => {
      console.log("Initializing SwiperCarousel");
      this.init();
    });
  }

  disconnectedCallback() {
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = null;
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

class ProductGallery extends HTMLElement {
  constructor() {
    super();
    this.mainImage = null;
    this.thumbs = [];
    this.onThumbClick = this.onThumbClick.bind(this);
  }

  connectedCallback() {
    requestAnimationFrame(() => {
      this.init();
    });
  }

  disconnectedCallback() {
    this.cleanup();
  }

  init() {
    this.mainImage = this.querySelector("[data-main-image] img");
    this.thumbs = Array.from(this.querySelectorAll("[data-gallery-thumb]"));

    if (!this.mainImage || !this.thumbs.length) return;

    this.thumbs.forEach((thumb) => {
      thumb.addEventListener("click", this.onThumbClick);
    });
  }

  cleanup() {
    this.thumbs.forEach((thumb) => {
      thumb.removeEventListener("click", this.onThumbClick);
    });
  }

  onThumbClick(event) {
    event.preventDefault();

    const thumb = event.currentTarget;
    const wrapper = thumb.closest("[data-gallery-item]");
    if (!wrapper) return;

    const { large, srcset, sizes } = thumb.dataset;

    if (!large) return;

    this.mainImage.src = large;
    this.mainImage.alt = thumb.alt || "";

    if (srcset) {
      this.mainImage.srcset = srcset;
      this.mainImage.sizes = sizes;
    } else {
      this.mainImage.removeAttribute("srcset");
      this.mainImage.removeAttribute("sizes");
    }

    this.setActiveThumb(thumb);
  }

  setActiveThumb(activeThumb) {
    this.querySelectorAll("[data-gallery-item].active").forEach((el) =>
      el.classList.remove("active")
    );

    const wrapper = activeThumb.closest("[data-gallery-item]");
    if (wrapper) wrapper.classList.add("active");
  }
}

customElements.define("product-gallery", ProductGallery);

class AccordionItem extends HTMLElement {
  constructor() {
    super();
    this.toggleButton = null;
    this.content = null;
  }

  connectedCallback() {
    this.toggleButton = this.querySelector(".accordion-toggle");
    this.content = this.querySelector(".accordion-content");
    if (!this.toggleButton || !this.content) return;

    this.toggleButton.setAttribute("aria-expanded", this.hasAttribute("open"));

    this.toggleButton.addEventListener("click", () => this.toggle());

    this.toggleButton.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.toggle();
      }
    });

    if (!this.hasAttribute("open")) {
      this.content.style.display = "none";
    }
  }

  toggle() {
    const isOpen = this.hasAttribute("open");
    if (isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    const wrapper = this.closest("[data-allow-multiple]");
    const allowMultiple =
      wrapper?.getAttribute("data-allow-multiple") === "true";

    if (!allowMultiple) {
      const openItems = wrapper?.querySelectorAll("accordion-item[open]");
      openItems.forEach((item) => {
        if (item !== this) {
          item.removeAttribute("open");
        }
      });
    }

    this.setAttribute("open", "");
    this.toggleButton.setAttribute("aria-expanded", "true");
    this.content.style.display = "block";
  }
  close() {
    this.removeAttribute("open", "");
    this.toggleButton.setAttribute("aria-expanded", "false");

    setTimeout(() => {
      if (!this.hasAttribute("open")) {
        this.content.style.display = "none";
      }
    }, 400);
  }
}

customElements.define("accordion-item", AccordionItem);
