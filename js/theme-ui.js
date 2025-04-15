// theme-ui.js

// Class for managing theme
export class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('theme-toggle');
        this.themeIcon = document.getElementById('theme-icon');
        
        this.setupEventListeners();
        this.initializeTheme();
    }
    
    setupEventListeners() {
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }
    
    initializeTheme() {
        // Set initial theme based on user preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
            this.themeIcon.setAttribute('name', 'sunny-outline');
        }
    }
    
    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        
        if (document.body.classList.contains('dark-theme')) {
            this.themeIcon.setAttribute('name', 'sunny-outline');
        } else {
            this.themeIcon.setAttribute('name', 'moon-outline');
        }
    }
}

// Class for managing tabs
export class TabManager {
    constructor(onTabSelected) {
        this.tabsContainer = document.querySelector('.tabs');
        this.onTabSelected = onTabSelected;
    }
    
    updateTabs(favorites, currentLocation) {
        this.tabsContainer.innerHTML = '';
        let activeTabExists = false;
    
        favorites.forEach(favorite => {
            const tabElement = document.createElement('div');
            tabElement.className = 'tab';
            tabElement.textContent = `${favorite.city}, ${favorite.country}`;
    
            // Only activate tab if it matches current location AND exists in favorites
            if (currentLocation && 
                favorite.lat === currentLocation.lat && 
                favorite.lon === currentLocation.lon) {
                tabElement.classList.add('active');
                activeTabExists = true;
            }
    
            tabElement.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tabElement.classList.add('active');
                this.onTabSelected(favorite);
            });
    
            this.tabsContainer.appendChild(tabElement);
        });
    
        // Never auto-activate first tab
        if (favorites.length === 0) {
            this.tabsContainer.innerHTML = '<div class="tab inactive-tab">No favorites yet</div>';
        }
    }
}

// Class for managing settings modal
export class SettingsManager {
    constructor(favoritesManager, onFavoriteRemoved) {
        this.modal = document.getElementById('myModal');
        this.settingsBtn = document.getElementById('settings-button');
        this.closeModal = document.querySelector('.close');
        this.favoritesListContent = document.getElementById('favorites-list-content');
        this.favoritesManager = favoritesManager;
        this.onFavoriteRemoved = onFavoriteRemoved;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.settingsBtn.addEventListener('click', () => {
            this.openModal();
            this.updateFavoritesInSettings();
        });
        
        this.closeModal.addEventListener('click', () => {
            this.closeModal();
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    }
    
    openModal() {
        this.modal.style.display = 'block';
    }
    
    closeModal() {
        this.modal.style.display = 'none';
    }
    
    updateFavoritesInSettings() {
        const favorites = this.favoritesManager.getFavorites();
        
        if (favorites.length === 0) {
            this.favoritesListContent.innerHTML = '<div style="padding-top:5px;">No saved locations</div>';
            return;
        }
    
        this.favoritesListContent.innerHTML = favorites.map((favorite, index) => `
            <div class="favorite-item">
                <div>${favorite.city}, ${favorite.country}</div>
                <button class="remove-favorite" data-index="${index}">
                    <ion-icon name="trash-outline"></ion-icon>
                </button>
            </div>
        `).join('');
    
        // Add click handlers for remove buttons
        document.querySelectorAll('.remove-favorite').forEach(button => {
            button.addEventListener('click', () => {
                const index = parseInt(button.dataset.index);
                this.removeFavorite(index);
            });
        });
    }
    
    removeFavorite(index) {
        const favoritesData = JSON.parse(localStorage.getItem(this.favoritesManager.storageKey)) || [];
        if (index >= 0 && index < favoritesData.length) {
            favoritesData.splice(index, 1);
            // Change this line too:
            localStorage.setItem(this.favoritesManager.storageKey, JSON.stringify(favoritesData));
            this.updateFavoritesInSettings();
            if (this.onFavoriteRemoved) {
                this.onFavoriteRemoved(index);
            }
            return true;
        }
        return false;
    }
}