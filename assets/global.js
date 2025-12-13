class VariantSelector extends HTMLElement {
  constructor() {
    super();
  }

  get section() {
    return this.closest(".section__product-banner");
  }

  get form() {
    return document.getElementById(`product-form-${this.sectionId}`);
  }

  get hiddenInput() {
    return this.form?.querySelector('input[name="id"]');
  }

  get sectionId() {
    return this.dataset.sectionId;
  }

  get productHandle() {
    return this.dataset.productHandle;
  }

  get variants() {
    if (!this._variants) {
      const jsonEl = document.querySelector(
        `#ProductVariants-${this.sectionId}`
      );
      try {
        this._variants = JSON.parse(jsonEl?.textContent || "[]");
      } catch (e) {
        console.error("Failed to parse variants JSON", e);
        this._variants = [];
      }
    }
    return this._variants;
  }

  get optionInputs() {
    return this.querySelectorAll('input[type="radio"]');
  }

  connectedCallback() {
    this.optionInputs.forEach((input) => {
      input.addEventListener("change", (e) => this.onChange(e.target));
    });

    this.syncInitialState();
  }

  onChange(input) {
    this.updateActiveForGroup(input);
    this.updateFromSelection();
  }

  syncInitialState() {
    this.updateFromSelection();
  }

  updateFromSelection() {
    const options = this.getSelectedOptions();
    const variant = this.findVariant(options);

    if (variant) {
      this.hiddenInput.value = variant.id;
      this.updateButtonState(!variant.available);
      this.renderSection(variant.id);
    } else {
      this.updateButtonState(true);
    }
  }

  getSelectedOptions() {
    const groups = Array.from(this.querySelectorAll('input[type="radio"]'))
      .map((i) => i.name)
      .filter((v, i, arr) => arr.indexOf(v) === i);

    return groups.map((groupName) => {
      const checked = this.querySelector(`input[name="${groupName}"]:checked`);
      return checked ? checked.value : null;
    });
  }

  findVariant(optionValues) {
    return (
      this.variants.find((v) =>
        optionValues.every((value, index) => {
          if (!value) return true;
          return v[`option${index + 1}`] === value;
        })
      ) || null
    );
  }

  updateActiveForGroup(input) {
    const group = input.name;
    this.querySelectorAll(`input[name="${group}"]`).forEach((i) => {
      const label = i.nextElementSibling;
      if (label) label.classList.toggle("active", i === input);
    });
  }

  updateButtonState(disable = true) {
    const btn = this.form.querySelector('button[type="submit"]');
    const btnText = btn.querySelector("[data-atc-text]");

    if (!btn) return;

    if (disable) {
      btn.setAttribute("disabled", "disabled");
      btn.classList.add("button--disabled");
      btnText.textContent = window.variantStrings?.soldOut || "Sold out";
    } else {
      btn.removeAttribute("disabled");
      btn.classList.remove("button--disabled");
      btnText.textContent = window.variantStrings?.addToCart || "Add to cart";
    }
  }

  renderSection(variantId) {
    const url = `/products/${this.productHandle}?variant=${variantId}&sections=${this.sectionId}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const html = data[this.sectionId];
        if (!html) return;

        const temp = document.createElement("div");
        temp.innerHTML = html;

        this.updateBlock("[data-price-container]", temp);
        this.updateBlock("[data-inventory-quantity]", temp);
        this.updateBlock("[data-product-images]", temp, true);
      })
      .catch(console.error);
  }

  updateBlock(selector, temp, reInit = false) {
    const newNode = temp.querySelector(selector);
    const current = this.section.querySelector(selector);
    if (!newNode || !current) return;

    current.innerHTML = newNode.innerHTML;

    if (reInit) initProductGallery(this.section);
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
