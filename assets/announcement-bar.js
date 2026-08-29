class AnnouncementBar extends HTMLElement {
  connectedCallback() {
    this.closeButton = this.querySelector('[data-announcement-close]');
    this.swiperContainer = this.querySelector('[data-announcement-swiper]');
    this.swiperInstance = null;
    this.closeHandler = this.handleClose.bind(this);

    if (this.isDesignMode() || !this.isDismissed()) {
      this.show();
    }

    this.closeButton?.addEventListener('click', this.closeHandler);
    this.initSwiper();
  }

  disconnectedCallback() {
    this.closeButton?.removeEventListener('click', this.closeHandler);
    this.destroySwiper();
  }

  handleClose() {
    this.storeDismissed();
    this.hide();
  }

  hide() {
    this.setAttribute('hidden', '');
    this.setAttribute('aria-hidden', 'true');
  }

  show() {
    this.removeAttribute('hidden');
    this.removeAttribute('aria-hidden');
  }

  initSwiper() {
    if (!this.swiperContainer) return;

    const prevBtn = this.querySelector('[data-announcement-prev]');
    const nextBtn = this.querySelector('[data-announcement-next]');

    const autoplayDelay = this.swiperContainer.dataset.autoplayDelay;

    const slides = Array.from(this.querySelectorAll('.swiper-slide'));
    if (slides.length < 2) return;

    if (typeof Swiper === 'undefined') {
      console.warn('Swiper library not loaded');
      return;
    }

    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true);
      this.swiperInstance = null;
    }

    const config = {
      slidesPerView: 1,
      spaceBetween: 16,
      loop: false,
      autoHeight: true,
      watchOverflow: true,
      allowTouchMove: true,
      observer: true,
      observeParents: true,
    };

    if (prevBtn && nextBtn) {
      config.navigation = {
        prevEl: prevBtn,
        nextEl: nextBtn,
      };
    }

    if (autoplayDelay) {
      config.autoplay = {
        delay: autoplayDelay,
      };
    }

    this.swiperInstance = new Swiper(this.swiperContainer, config);

    this.updateSlidesA11y();
    this.swiperInstance.on('slideChange', () => this.updateSlidesA11y());
  }

  destroySwiper() {
    if (!this.swiperInstance) return;
    this.swiperInstance.destroy(true, true);
    this.swiperInstance = null;
  }

  updateSlidesA11y() {
    if (!this.swiperInstance) return;
    const { slides, activeIndex } = this.swiperInstance;

    for (const [index, slide] of slides.entries()) {
      if (index === activeIndex) {
        slide.removeAttribute('aria-hidden');
        continue;
      }

      slide.setAttribute('aria-hidden', 'true');
    }
  }

  storageKey() {
    return this.dataset.storageKey || 'announcement-bar-dismissed';
  }

  isDesignMode() {
    return (
      document.documentElement.classList.contains('shopify-design-mode') ||
      Boolean(window.Shopify && window.Shopify.designMode)
    );
  }

  isDismissed() {
    try {
      return window.localStorage.getItem(this.storageKey()) === 'closed';
    } catch (error) {
      return false;
    }
  }

  storeDismissed() {
    try {
      window.localStorage.setItem(this.storageKey(), 'closed');
    } catch (error) {
      return;
    }
  }
}

if (!customElements.get('announcement-bar')) {
  customElements.define('announcement-bar', AnnouncementBar);
}
