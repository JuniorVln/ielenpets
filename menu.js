/* Menu mobile Ielenpet — drawer lateral com hambúrguer.
   Compartilhado por todas as páginas; seguro para carregar em qualquer ordem. */
(function () {
    const menu = document.getElementById('mobileMenu');
    const panel = document.getElementById('mobileMenuPanel');
    const toggle = document.getElementById('menuToggle');
    if (!menu || !panel || !toggle) return;

    const overlay = menu.querySelector('[data-menu-close]');

    function open() {
        menu.classList.remove('hidden');
        menu.setAttribute('aria-hidden', 'false');
        toggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => {
            panel.classList.remove('translate-x-full');
            if (overlay) overlay.classList.remove('opacity-0');
        });
    }

    function close() {
        panel.classList.add('translate-x-full');
        if (overlay) overlay.classList.add('opacity-0');
        toggle.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        setTimeout(() => menu.classList.add('hidden'), 300);
    }

    toggle.addEventListener('click', open);
    menu.querySelectorAll('[data-menu-close]').forEach((el) => el.addEventListener('click', close));
    panel.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !menu.classList.contains('hidden')) close();
    });
})();
