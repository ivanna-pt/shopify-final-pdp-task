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

          setTimeout(() => {
            this.initSwiper();
          }, 300);
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
