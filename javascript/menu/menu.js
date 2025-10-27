import { optionsModal } from './OptionsModal.js';

document.addEventListener('DOMContentLoaded', () => {
    // Log to confirm the script starts after the page loads
    console.log("DEBUG: DOM fully loaded. Initializing interactive menu script.");

    const body = document.querySelector('body');
    const background = document.querySelector('.background');
    const clouds = document.querySelector('.clouds-layer');
    const cursorFollower = document.getElementById('cursor-follower');
    const menuButtons = document.querySelectorAll('.menu-button');
    const menuContainer = document.querySelector('.menu-container');

    // NEW: Elements for the Credits screen
    const creditsButton = document.getElementById('credits-button');
    const creditsOverlay = document.getElementById('credits-overlay');
    const closeCreditsButton = document.getElementById('close-credits');
    const creditsContent = document.querySelector('.credits-content');
    const creditsScroller = document.querySelector('.credits-scroller');
    const optionsButton = document.getElementById('options-button');

    // --- 1. Cursor Follower & Custom Cursor Logic ---
    // Define the URLs for your cursor images using relative paths from the index.html file
    const cursorOuterURL = 'assets/cursor.png'; // The default cursor
    const cursorInnerURL = 'assets/clicker.png'; // The cursor for buttons
    const cursorCloudURL = 'assets/cloud_clicker.png'; // The cursor for hovering over clouds

    if (cursorFollower) {
        // Set the initial cursor image
        cursorFollower.src = cursorOuterURL;

        // Make the image follow the mouse
        document.addEventListener('mousemove', (e) => {
            cursorFollower.style.left = e.clientX + 'px';
            cursorFollower.style.top = e.clientY + 'px';
        });

        // Change the cursor image when hovering over the clouds
        if (clouds) {
            clouds.addEventListener('mouseenter', () => {
                cursorFollower.src = cursorCloudURL;
                cursorFollower.classList.remove('clicker-style');
                cursorFollower.classList.add('pointer-style');
            });

            clouds.addEventListener('mouseleave', () => {
                cursorFollower.src = cursorOuterURL;
            });
        }
        
        // Logic for menu buttons
        if (menuButtons) {
            menuButtons.forEach(button => {
                button.addEventListener('mouseenter', () => {
                    cursorFollower.src = cursorInnerURL;
                    // Apply style to align the clicker's hotspot
                    cursorFollower.classList.add('clicker-style');
                    cursorFollower.classList.remove('pointer-style');
                });
                // When leaving a button, revert to the default cursor
                button.addEventListener('mouseleave', () => {
                    cursorFollower.src = cursorOuterURL;
                    cursorFollower.classList.remove('clicker-style');
                    cursorFollower.classList.add('pointer-style');
                });
            });
        }

        // Add hover effect for the close credits button
        if(closeCreditsButton) {
             closeCreditsButton.addEventListener('mouseenter', () => {
                cursorFollower.src = cursorInnerURL;
                cursorFollower.classList.add('clicker-style');
                cursorFollower.classList.remove('pointer-style');
            });
            closeCreditsButton.addEventListener('mouseleave', () => {
                cursorFollower.src = cursorOuterURL;
                cursorFollower.classList.remove('clicker-style');
                cursorFollower.classList.add('pointer-style');
            });
        }

    }

    // --- 2. Raining Clouds Easter Egg ---
    let isRaining = false;
    if (clouds) {
        clouds.addEventListener('click', () => {
            console.log("DEBUG: Clouds clicked!");
            if (isRaining) {
                console.log("DEBUG: It's already raining. Ignoring click.");
                return;
            }
            
            console.log("DEBUG: Starting rain effect...");
            isRaining = true;

            for (let i = 0; i < 50; i++) {
                const drop = document.createElement('div');
                drop.classList.add('raindrop');
                
                drop.style.left = `${Math.random() * 100}vw`;
                drop.style.animationDelay = `${Math.random() * 2}s`;

                background.appendChild(drop);
                
                setTimeout(() => {
                    drop.remove();
                }, 4000);
            }

            setTimeout(() => {
                console.log("DEBUG: Rain effect finished.");
                isRaining = false;
            }, 4000);
        });
    } else {
        console.error("DEBUG ERROR: '.clouds-layer' element not found. Rain effect will not work.");
    }

    // --- 3. Page Fade-Out Transition (for navigation buttons) ---
    menuButtons.forEach(button => {
        // We only want this for buttons that actually go somewhere
        if (button.id !== 'credits-button' && button.id !== 'options-button') {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("DEBUG: Menu button clicked:", e.target.textContent);
                
                const destination = button.href;
                if (!destination || destination.endsWith('#')) return;

                console.log(`DEBUG: Fading out to navigate to: ${destination}`);
                body.classList.add('fade-out');
                setTimeout(() => {
                    window.location.href = destination;
                }, 500);
            });
        }
    });

    // --- 4. Credits Overlay Logic ---
    let creditsSkipped = false;

    //Function to skip the animation and enable scrolling
    function skipCreditsAnimation() {
        if (!creditsSkipped) {
            console.log("DEBUG: Skipping credits animation.");
            creditsSkipped = true;
            // Add classes to stop animation and allow scrolling
            creditsScroller.classList.add('animation-finished');
            creditsContent.classList.add('scrollable');
        }
    }

    if (creditsButton && creditsOverlay && closeCreditsButton) {
        // Open the credits
        creditsButton.addEventListener('click', (e) => {
            e.preventDefault(); 
            console.log("DEBUG: Credits button clicked.");
            
            // Reset the state every time credits are opened
            body.classList.add('credits-active'); 
            creditsSkipped = false;
            creditsScroller.classList.remove('animation-finished');
            creditsContent.classList.remove('scrollable');
            
            menuContainer.style.opacity = '0'; 
            creditsOverlay.classList.remove('hidden');

            // Automatically enable scrolling when the animation finishes naturally
            creditsScroller.addEventListener('animationend', skipCreditsAnimation, { once: true });
        });

        // Close the credits
        closeCreditsButton.addEventListener('click', () => {
            console.log("DEBUG: Close credits button clicked.");
            creditsOverlay.classList.add('hidden');
            body.classList.remove('credits-active'); 
            setTimeout(() => {
                menuContainer.style.opacity = '1';
            }, 400); 
        });

        // Add event listeners to skip the animation
        creditsOverlay.addEventListener('click', (e) => {
            // Only skip if the user clicks the general overlay, not the close button
            if (e.target !== closeCreditsButton) {
                skipCreditsAnimation();
            }
        });

        document.addEventListener('keydown', (e) => {
            // Check if credits are visible and the spacebar is pressed
            if (!creditsOverlay.classList.contains('hidden') && e.code === 'Space') {
                e.preventDefault(); // Prevents the page from scrolling
                skipCreditsAnimation();
            }
        });

    } else {
        console.error("DEBUG ERROR: One or more credits elements not found.");
    }

    if (optionsButton) {
        optionsButton.addEventListener('click', (e) => {
            e.preventDefault(); // Impede que o link (href="#") mude a URL
            console.log("DEBUG: Options button clicked.");
            
            // Apenas chama o método 'show' do componente importado
            optionsModal.show();
        });
    }

});

