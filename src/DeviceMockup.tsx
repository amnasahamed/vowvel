import React from 'react';

export type DeviceAngle = 'front' | 'isometric' | 'tilt';

interface DeviceMockupProps {
  device: 'mobile' | 'desktop';
  angle?: DeviceAngle;
  children: React.ReactNode;
}

export default function DeviceMockup({ device, angle = 'front', children }: DeviceMockupProps) {
  if (device === 'mobile') {
    return (
      <div className={`phone-stage angle-${angle}`}>
        <div className="phone-device-mockup" aria-label="Phone (Mobile view)">
          {/* External Hardware Buttons (Machined Titanium) */}
          <div className="phone-btn phone-action-btn" aria-hidden="true" />
          <div className="phone-btn phone-vol-up" aria-hidden="true" />
          <div className="phone-btn phone-vol-down" aria-hidden="true" />
          <div className="phone-btn phone-power-btn" aria-hidden="true" />

          {/* Physical Titanium Chassis */}
          <div className="phone-chassis">
            {/* Antenna Bands */}
            <div className="phone-antenna antenna-top-left" aria-hidden="true" />
            <div className="phone-antenna antenna-top-right" aria-hidden="true" />
            <div className="phone-antenna antenna-bottom-left" aria-hidden="true" />
            <div className="phone-antenna antenna-bottom-right" aria-hidden="true" />

            {/* Precision Micro Bezel Rim */}
            <div className="phone-screen-rim">
              {/* Glass OLED Screen Surface */}
              <div className="phone-screen">
                {/* Speaker Earpiece Grill */}
                <div className="phone-speaker-earpiece" aria-hidden="true" />

                {/* Dynamic Sensor Island */}
                <div className="phone-dynamic-island" aria-hidden="true">
                  <div className="island-camera">
                    <span className="camera-aperture-ring" />
                    <span className="camera-lens-reflection" />
                  </div>
                  <div className="island-sensor" />
                </div>

                {/* Specular Glass Glare Sheen (Realistic Studio Lighting Reflection) */}
                <div className="device-specular-glare phone-glare" aria-hidden="true" />

                {/* Interactive Live Invitation Viewport */}
                <div className="phone-viewport">
                  {children}
                </div>

                {/* Tactile Home Indicator Bar */}
                <div className="phone-home-indicator" aria-hidden="true">
                  <span className="home-bar-core" />
                </div>
              </div>
            </div>
          </div>

          {/* Realistic Physics Ground & Ambient Contact Shadow */}
          <div className="phone-shadow-projection" aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div className={`desktop-stage angle-${angle}`}>
      <div className="desktop-device-mockup" aria-label="Desktop (Web view)">
        {/* Display Lid Enclosure */}
        <div className="desktop-lid">
          {/* Bezel Camera Housing / Notch */}
          <div className="desktop-camera-notch" aria-hidden="true">
            <div className="desktop-camera-lens">
              <span className="camera-optic-dot" />
            </div>
            <div className="desktop-camera-indicator" />
          </div>

          {/* Display Glass Panel & Bezel */}
          <div className="desktop-screen">
            {/* Desktop Web Browser Bar */}
            <div className="desktop-browser-bar" aria-hidden="true">
              <div className="browser-traffic-lights">
                <span className="dot dot-close" />
                <span className="dot dot-minimize" />
                <span className="dot dot-expand" />
              </div>
              <div className="browser-url-bar">
                <span className="browser-url-ssl">🔒</span>
                <span className="browser-url-host">vowvel.com</span>
                <span className="browser-url-slug">/our-invitation</span>
              </div>
              <div className="browser-actions-ghost" />
            </div>

            {/* Glass Surface Specular Sheen */}
            <div className="device-specular-glare desktop-glare" aria-hidden="true" />

            {/* Interactive Live Invitation Viewport */}
            <div className="desktop-viewport">
              <div className="desktop-canvas-scaler">
                {children}
              </div>
            </div>
          </div>
        </div>

        {/* Precision Milled Aluminum Unibody Base Deck */}
        <div className="desktop-base" aria-hidden="true">
          <div className="desktop-hinge" />
          <div className="desktop-base-top-lip" />
          <div className="desktop-notch" />
        </div>

        {/* Physics Ambient Ground Shadow */}
        <div className="desktop-base-shadow" aria-hidden="true" />
      </div>
    </div>
  );
}

