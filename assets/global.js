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
          } else {
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
    updateElement("quantity-input");

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
          submitBtn.classList.add("disabled");
        } else {
          submitBtn.removeAttribute("disabled");
          submitBtn.classList.remove("disabled");
        }

        if (btnText && newBtnText) {
          btnText.textContent = newBtnText.textContent;
        }
      }
    });
  }
  static reinitialize(section) {}
}

customElements.define("product-info", ProductInfo);

class QuantityInput extends HTMLElement {
  constructor() {
    super();

    this.changeEvent = new Event("change", { bubbles: true });
  }

  connectedCallback() {
    this.input = this.querySelector("input");
    this.onButtonClick = this.onButtonClick.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.input.addEventListener("change", this.onInputChange);
    this.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", this.onButtonClick);
    });

    this.validateQtyRules();
  }

  onInputChange() {
    this.validateQtyRules();
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    if (event.currentTarget.name === "plus") {
      if (
        parseInt(this.input.dataset.min) > parseInt(this.input.step) &&
        this.input.value == 0
      ) {
        this.input.value = this.input.dataset.min;
      } else {
        this.input.stepUp();
      }
    } else {
      this.input.stepDown();
    }

    if (previousValue !== this.input.value)
      this.input.dispatchEvent(this.changeEvent);

    if (
      this.input.dataset.min === previousValue &&
      event.target.name === "minus"
    ) {
      this.input.value = parseInt(this.input.min);
    }
  }

  validateQtyRules() {
    const value = parseInt(this.input.value, 10);
    if (this.input.min) {
      const buttonMinus = this.querySelector("button[name='minus']");
      buttonMinus.classList.toggle(
        "disabled",
        parseInt(value) < parseInt(this.input.min)
      );
    }

    if (this.input.max) {
      const buttonPlus = this.querySelector("button[name='plus']");
      buttonPlus.classList.toggle("disabled", value >= this.input.max);
    }
  }
}

customElements.define("quantity-input", QuantityInput);

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

class ProductForm extends HTMLElement {
  constructor() {
    super();
    this.form = null;
  }
  connectedCallback() {
    this.form = this.querySelector("form");
    this.errorWrapper = this.querySelector(".error-message-wrapper");
    this.errorMessage = this.errorWrapper?.querySelector(".error-message");
    if (!this.form) return;

    this.form.addEventListener("submit", this.onSubmit.bind(this));
  }

  async onSubmit(event) {
    event.preventDefault();

    this.clearError();

    if (!this.validateQuantity()) {
      console.log("Quantity validation faild");
      return;
    }

    const formData = new FormData(this.form);

    try {
      const addResponse = await fetch("/cart/add.js", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      if (!addResponse.ok) {
        const error = await response.json();
        this.showError(error.description || error.message);
        return;
      }

      await this.updateHeaderCartCount();
    } catch (error) {
      this.showError(error.description);
      console.error(error);
    }
  }

  async updateHeaderCartCount() {
    const sectionsToRender = ["cart-icon-bubble"];
    const url = `/?sections=${sectionsToRender.join(",")}`;

    const response = await fetch(url);
    const data = await response.json();
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = data["cart-icon-bubble"];

    const bubble = document.querySelector("#cart-icon-bubble");
    const currentCount = bubble.querySelector(".cart-count-bubble");
    const newCount = tempDiv.querySelector(".cart-count-bubble");

    if (currentCount && tempDiv.querySelector(".cart-count-bubble")) {
      currentCount.innerHTML = newCount.innerHTML;
    }
  }

  validateQuantity() {
    const productFormId = this.form.getAttribute("id");
    const qtyInput = document.querySelector(
      `input[name="quantity"][form="${productFormId}"]`
    );
    if (!qtyInput) return true;

    const value = Number(qtyInput.value);
    const min = Number(qtyInput.min || 1);
    const max = qtyInput.max ? Number(qtyInput.max) : null;

    if (value < min) {
      this.showError(`Minimum quantity is ${min}.`);
      qtyInput.focus();
      return false;
    }

    if (max !== null && value > max) {
      this.showError(`Only ${max} item${max > 1 ? "s" : ""} available.`);
      qtyInput.focus();
      return false;
    }

    return true;
  }

  showError(message) {
    if (!this.errorWrapper || !this.errorMessage) return;
    this.errorMessage.textContent = message;
    this.errorWrapper.classList.remove("hidden");
  }

  clearError() {
    if (!this.errorWrapper) return;

    this.errorWrapper.classList.add("hidden");
    this.errorMessage.textContent = "";
  }
}
customElements.define("product-form", ProductForm);

class RelatedProducts extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.loadRecommendations();
  }

  async loadRecommendations() {
    fetch(
      `${this.dataset.url}?product_id=${this.dataset.productId}&${this.dataset.limit}&section_id=${this.dataset.sectionId}`
    )
      .then((response) => response.text())
      .then((text) => {
        const html = document.createElement("div");
        html.innerHTML = text;
        const recommendations = html.querySelector("related-products");

        if (recommendations && recommendations.innerHTML.trim().length) {
          this.innerHTML = recommendations.innerHTML;
        } else {
          this.style.display = "none";
        }
      })
      .catch((error) => {
        console.error("Error loading recommendations:", error);
        this.style.display = "none";
      });
  }
}

customElements.define("related-products", RelatedProducts);

class SwiperCarousel extends HTMLElement {
  constructor() {
    super();
    this.swiper = null;
  }

  connectedCallback() {
    const images = this.querySelectorAll(".swiper-slide img");

    if (images.length === 0) {
      this.init();
      return;
    }

    Promise.all(
      Array.from(images).map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.onload = img.onerror = resolve;
            })
      )
    ).then(() => this.init());
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

    if (config.navigation?.enabled) {
      config.navigation = {
        nextEl: this.querySelector(".swiper-button-next-custom"),
        prevEl: this.querySelector(".swiper-button-prev-custom"),
      };
    }

    if (config.pagination?.enabled) {
      config.pagination = {
        el: this.querySelector(".swiper-pagination"),
        clickable: true,
      };
    }
    config.observer = true;
    config.observeParents = true;

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
    this.onThumbKeydown = this.onThumbKeydown.bind(this);
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
    this.mainImage = this.querySelector(".product-gallery__main-image img");
    this.thumbs = Array.from(this.querySelectorAll(".product-gallery__item"));

    if (!this.mainImage || !this.thumbs.length) return;

    this.thumbs.forEach((thumb) => {
      thumb.addEventListener("click", this.onThumbClick);
      thumb.addEventListener("keydown", this.onThumbKeydown);
    });
  }

  cleanup() {
    this.thumbs.forEach((thumb) => {
      thumb.removeEventListener("click", this.onThumbClick);
      thumb.removeEventListener("keydown", this.onThumbKeydown);
    });
  }

  onThumbClick(event) {
    event.preventDefault();

    const wrapper = event.currentTarget;
    const img = wrapper.querySelector(".product-gallery__thumb");
    if (!img) return;

    this.updateMainImage(img);
    this.setActiveThumb(wrapper);
  }

  onThumbKeydown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.currentTarget.click();
    }
  }

  updateMainImage(img) {
    const { large, srcset, sizes } = img.dataset;
    if (!large) return;
    this.mainImage.src = large;
    this.mainImage.alt = img.alt || "";
    if (srcset) {
      this.mainImage.srcset = srcset;
      this.mainImage.sizes = sizes;
    } else {
      this.mainImage.removeAttribute("srcset");
      this.mainImage.removeAttribute("sizes");
    }
  }

  setActiveThumb(activeWrapper) {
    this.querySelectorAll(".product-gallery__item.active").forEach((el) => {
      el.classList.remove("active");
      el.setAttribute("aria-pressed", false);
    });

    activeWrapper.classList.add("active");
    activeWrapper.setAttribute("aria-pressed", true);
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

    this.sync();

    this.toggleButton.addEventListener("click", () => this.toggle());
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
    this.sync();
    // this.toggleButton.setAttribute("aria-expanded", "true");
    // this.content.style.display = "block";
  }
  close() {
    this.removeAttribute("open", "");
    this.sync();
    // this.toggleButton.setAttribute("aria-expanded", "false");

    // setTimeout(() => {
    //   if (!this.hasAttribute("open")) {
    //     this.content.style.display = "none";
    //   }
    // }, 400);
  }
  sync() {
    const isOpen = this.hasAttribute("open");

    this.toggleButton.setAttribute("aria-expanded", isOpen ? "true" : "false");

    this.content.hidden = !isOpen;
  }
}

customElements.define("accordion-item", AccordionItem);
