// AdBanner.tsx - Updated with new ad code
import { onMount, onCleanup, createEffect } from "solid-js";

interface AdBannerProps {
  class?: string;
  width?: string;
  height?: string;
  forceReload?: boolean; // Add this to force reload when modal opens
}

export default function AdBanner(props: AdBannerProps) {
  let adContainerRef: HTMLDivElement | undefined;
  let scriptElement: HTMLScriptElement | undefined;

  const loadAd = () => {
    if (!adContainerRef) return;

    // Clear any existing content
    adContainerRef.innerHTML = '';

    // Create the container div with specific ID
    const containerDiv = document.createElement('div');
    containerDiv.id = 'container-531da32ec3fcb205a3490d7e5bc1f538';
    
    // Append container div to the ad container
    adContainerRef.appendChild(containerDiv);
    
    // Create and configure the script element
    const script = document.createElement('script');
    script.setAttribute('async', 'async');
    script.setAttribute('data-cfasync', 'false');
    script.type = 'text/javascript';
    script.src = '//pl15018358.effectivegatecpm.com/531da32ec3fcb205a3490d7e5bc1f538/invoke.js';
    
    // Store reference for cleanup
    scriptElement = script;
    
    // Append script to document head
    document.head.appendChild(script);
    
    console.log("AdBanner: Script loaded successfully");
    
    script.onerror = () => {
      console.error("AdBanner: Failed to load ad script");
      if (adContainerRef) {
        adContainerRef.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">Ad Loading...</div>';
      }
    };
  };

  onMount(() => {
    // Small delay to ensure the container is visible
    setTimeout(() => {
      loadAd();
    }, 100);
  });

  // Reload ad when forceReload prop changes (useful for modals)
  createEffect(() => {
    if (props.forceReload) {
      setTimeout(() => {
        loadAd();
      }, 200);
    }
  });

  onCleanup(() => {
    // Clean up script element
    if (scriptElement && scriptElement.parentNode) {
      scriptElement.parentNode.removeChild(scriptElement);
    }
    // Clear container
    if (adContainerRef) {
      adContainerRef.innerHTML = '';
    }
  });

  const containerStyle = {
    width: props.width || 'auto',
    height: props.height || 'auto',
    minHeight: props.height || '250px',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
  };

  return (
    <div 
      ref={adContainerRef} 
      class={props.class || 'ad-banner'} 
      style={containerStyle}
    >
      {/* Ad content will be dynamically inserted here */}
    </div>
  );
}