import type { ControlPosition, IControl, Map as MapSDK } from "@maptiler/sdk";
import {
  ElevationProfile,
  type ElevationProfileOptions,
} from "./elevationprofile";
import { isUUID } from "./tools";
// @ts-ignore
import elevationIcon from "./images/elevation-icon.svg";
// @ts-ignore
import elevationFillIcon from "./images/elevation_fill-icon.svg";
import type { GeoJsonObject } from "geojson";

/**
 * Elevation profile control options
 */
export type ElevationProfileControlOptions = ElevationProfileOptions & {
  /**
   * If `true`, the elevation profile control will be visible as soon as it's ready.
   * If `false`, a click on the control button (or a programmatic call to `.showProfile()`)
   * will be neccesary to show the profile.
   *
   * Default: `false`
   */
  visible?: boolean;
  /**
   * Size of the profile as a CSS rule.
   * This `size` will be the `width` if the `.position` is "left" or "right",
   * and will be the `height` if the `.position` is "top" or "bottom".
   *
   * Default: `"30%"`
   */
  size?: string;
  /**
   * Position of the elevation profile chart when shown.
   *
   * Default: `"botton"`
   */
  position?: "top" | "left" | "right" | "bottom";
  /**
   * Show the control button. If can be handy to hide it, especially if the profile is displayed
   * in a custom container and that its visiblity is managed by logic external to this control.
   *
   * Default: `true`
   */
  showButton?: boolean;
  /**
   * A CSS class to add to the container. This is especially relevant when the options `.container` is not provided.
   * Important: if provided, no styling is added by this control and even placement will have to be managed by external CSS.
   *
   * Default: `""`
   */
  containerClass?: string;

  /**
   * DIV element to contain the control.
   * Important: if provided, no styling is added by this control.
   * Default: automatically created inside the map container
   */
  container?: string | HTMLDivElement;
};

export class ElevationProfileControl implements IControl {
  private map?: MapSDK;
  private buttonContainer?: HTMLDivElement;
  private toggleButton?: HTMLButtonElement;
  private isProfileShown = false;
  private iconSpan?: HTMLSpanElement;

  private profileContainer?: HTMLDivElement;
  private settings: ElevationProfileControlOptions;
  private data: GeoJsonObject | null = null;
  private elevationProfileChart?: ElevationProfile;

  constructor(options: ElevationProfileControlOptions = {}) {
    if (typeof window === "undefined")
      throw new Error("This pluggin must be mounted client-side");
    this.settings = { ...options };
  }

  getContainer(): HTMLDivElement | undefined {
    return this.profileContainer;
  }

  onAdd(map: MapSDK): HTMLElement {
    this.map = map;

    this.buttonContainer = document.createElement("div");

    if (this.settings.showButton === false) {
      this.buttonContainer.style.setProperty("display", "none");
    }

    this.buttonContainer.classList.add(
      "maplibregl-ctrl",
      "maplibregl-ctrl-group"
    );
    this.toggleButton = document.createElement("button");
    this.buttonContainer.appendChild(this.toggleButton);
    this.iconSpan = document.createElement("span");
    this.iconSpan.classList.add("maplibregl-ctrl-icon");
    this.toggleButton.appendChild(this.iconSpan);
    this.iconSpan.style.setProperty(
      "background-image",
      `url(${elevationIcon})`
    );
    this.toggleButton.addEventListener("click", this.toggleProfile.bind(this));
    const mapContainer = map.getContainer();
    const size = this.settings.size ?? "30%";

    if (this.settings.container) {
      const tmpContainer =
        typeof this.settings.container === "string"
          ? document.getElementById(this.settings.container)
          : this.settings.container;
      if (!tmpContainer) throw new Error("The provided container is invalid");
      this.profileContainer = tmpContainer as HTMLDivElement;
    } else {
      this.profileContainer = document.createElement("div");
      this.profileContainer.style.setProperty("display", "none");

      if (!this.settings.containerClass) {
        this.profileContainer.style.setProperty(
          "background-color",
          this.settings.backgroundColor ?? "white"
        );
        this.profileContainer.style.setProperty("position", "absolute");

        if (this.settings.position === "bottom" || !this.settings.position) {
          // To prevent clashing with MapTiler logo and attribution control
          this.settings.paddingBottom = this.settings.paddingBottom ?? 35;
          this.profileContainer.style.setProperty("width", "100%");
          this.profileContainer.style.setProperty("height", size);
          this.profileContainer.style.setProperty("bottom", "0");
        } else if (this.settings.position === "top") {
          this.profileContainer.style.setProperty("width", "100%");
          this.profileContainer.style.setProperty("height", size);
          this.profileContainer.style.setProperty("top", "0");
        } else if (this.settings.position === "left") {
          // To prevent clashing with MapTiler logo and attribution control
          this.settings.paddingBottom = this.settings.paddingBottom ?? 35;
          this.profileContainer.style.setProperty("width", size);
          this.profileContainer.style.setProperty("height", "100%");
          this.profileContainer.style.setProperty("left", "0");
        } else if (this.settings.position === "right") {
          // To prevent clashing with MapTiler logo and attribution control
          this.settings.paddingBottom = this.settings.paddingBottom ?? 35;
          this.profileContainer.style.setProperty("width", size);
          this.profileContainer.style.setProperty("height", "100%");
          this.profileContainer.style.setProperty("right", "0");
        }
      }

      mapContainer.appendChild(this.profileContainer);
    }

    if (this.settings.containerClass) {
      this.profileContainer.classList.add(this.settings.containerClass);
    }

    this.elevationProfileChart = new ElevationProfile(
      this.profileContainer,
      map.getSdkConfig().apiKey,
      this.settings
    );

    if (this.settings.visible) {
      this.showProfile();
    }

    return this.buttonContainer;
  }

  private toggleProfile() {
    if (!this.profileContainer) return;

    if (this.isProfileShown) {
      this.hideProfile();
    } else {
      this.showProfile();
    }
  }

  showProfile() {
    this.profileContainer?.style.setProperty("display", "inherit");
    this.iconSpan?.style.setProperty(
      "background-image",
      `url(${elevationFillIcon})`
    );
    this.isProfileShown = true;
  }

  hideProfile() {
    this.profileContainer?.style.setProperty("display", "none");
    this.iconSpan?.style.setProperty(
      "background-image",
      `url(${elevationIcon})`
    );
    this.isProfileShown = false;
  }

  onRemove(): void {
    // remove button
    if (this.buttonContainer?.parentNode) {
      this.buttonContainer.parentNode.removeChild(this.buttonContainer);
    }
    this.map = undefined;
    this.buttonContainer = undefined;
    this.toggleButton = undefined;
    this.isProfileShown = false;
  }

  getDefaultPosition?: (() => ControlPosition) | undefined;

  async setData(data: GeoJsonObject | string) {
    if (!this.map || !this.elevationProfileChart) {
      throw new Error(
        "The Elevation Profile Control needs to be mounted on a map instance before setting any data."
      );
    }

    if (typeof data === "string") {
      const url = isUUID(data)
        ? `https://api.maptiler.com/data/${data}/features.json?key=${
            this.map.getSdkConfig().apiKey
          }`
        : data;
      const routeRes = await fetch(url);
      this.data = await routeRes.json();
    } else {
      this.data = data;
    }

    if (!this.data) return;

    this.elevationProfileChart.setData(this.data);
  }
}
