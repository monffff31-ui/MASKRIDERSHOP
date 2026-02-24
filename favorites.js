(function () {
    const STORAGE_KEY = 'favorites';

    function safeParseJSON(value, fallback) {
        try {
            const parsed = JSON.parse(value);
            return parsed ?? fallback;
        } catch {
            return fallback;
        }
    }

    function getFavorites() {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = safeParseJSON(raw, []);
        return Array.isArray(parsed) ? parsed : [];
    }

    function saveFavorites(favorites) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }

    function isFavorited(id) {
        return getFavorites().some((item) => item.id === id);
    }

    function addFavorite(item) {
        const favorites = getFavorites();
        if (favorites.some((x) => x.id === item.id)) return;
        favorites.unshift(item);
        saveFavorites(favorites);
    }

    function removeFavorite(id) {
        const favorites = getFavorites().filter((item) => item.id !== id);
        saveFavorites(favorites);
    }

    function getCardData(cardEl) {
        const id = cardEl.getAttribute('data-fav-id');
        if (!id) return null;

        const title = cardEl.getAttribute('data-fav-title') || '';
        const priceText = cardEl.getAttribute('data-fav-price') || '';
        const image = cardEl.getAttribute('data-fav-image') || '';
        const priceNumber = Number(String(priceText).replace(/[^0-9.]/g, ''));

        return {
            id,
            title,
            priceText,
            priceNumber: Number.isFinite(priceNumber) ? priceNumber : null,
            image,
        };
    }

    function setButtonState(btn, favored) {
        btn.setAttribute('aria-pressed', favored ? 'true' : 'false');
        btn.classList.toggle('is-favorited', favored);
        btn.textContent = favored ? '💔 ลบรายการโปรด' : '❤️ เพิ่มรายการโปรด';
    }

    function enhanceProductCards() {
        const cards = document.querySelectorAll('[data-fav-id]');
        cards.forEach((card) => {
            const btn = card.querySelector('.fav-button');
            if (!btn) return;

            const id = card.getAttribute('data-fav-id');
            if (!id) return;

            setButtonState(btn, isFavorited(id));

            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                const data = getCardData(card);
                if (!data) return;

                const favored = isFavorited(data.id);
                if (favored) {
                    removeFavorite(data.id);
                    setButtonState(btn, false);
                } else {
                    addFavorite(data);
                    setButtonState(btn, true);
                }

                const countEl = document.getElementById('favoritesCount');
                if (countEl) countEl.textContent = String(getFavorites().length);
            });
        });

        const countEl = document.getElementById('favoritesCount');
        if (countEl) countEl.textContent = String(getFavorites().length);
    }

    function formatPrice(item) {
        if (item.priceText) return item.priceText;
        if (typeof item.priceNumber === 'number') return `฿${item.priceNumber.toLocaleString()}`;
        return '';
    }

    function renderFavoritesPage() {
        const listEl = document.getElementById('favoritesList');
        if (!listEl) return;

        const favorites = getFavorites();

        if (favorites.length === 0) {
            listEl.innerHTML = '<div class="favorites-empty">ยังไม่มีรายการโปรด</div>';
            return;
        }

        listEl.innerHTML = favorites
            .map((item) => {
                const title = item.title || '';
                const price = formatPrice(item);
                const image = item.image || '';

                return `
                <div class="favorite-item" data-fav-id="${item.id}">
                    <div class="favorite-thumb">
                        ${image ? `<img src="${image}" alt="${title}">` : ''}
                    </div>
                    <div class="favorite-info">
                        <div class="favorite-title">${title}</div>
                        <div class="favorite-price">${price}</div>
                    </div>
                    <div class="favorite-actions">
                        <button class="fav-remove-btn" data-remove-id="${item.id}">ลบ</button>
                    </div>
                </div>
                `;
            })
            .join('');

        listEl.querySelectorAll('[data-remove-id]').forEach((btn) => {
            btn.addEventListener('click', function () {
                const id = btn.getAttribute('data-remove-id');
                if (!id) return;
                removeFavorite(id);
                renderFavoritesPage();
                enhanceProductCards();
            });
        });

        const clearBtn = document.getElementById('clearFavoritesBtn');
        if (clearBtn) {
            clearBtn.onclick = function () {
                saveFavorites([]);
                renderFavoritesPage();
                enhanceProductCards();
            };
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        enhanceProductCards();
        renderFavoritesPage();
    });
})();
