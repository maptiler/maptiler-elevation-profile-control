import { ControlPosition, IControl, Map } from "@maptiler/sdk";
import { ElevationProfile, ElevationProfileOptions } from "./elevationprofile";
import { isUUID } from "./tools";
// @ts-ignore
import elevationIcon from "./images/elevation-icon.svg";
// @ts-ignore
import elevationFillIcon from "./images/elevation_fill-icon.svg";
import { GeoJsonObject } from "geojson";

export type ElevationProfileControlOptions = ElevationProfileOptions & {
  container?: string | HTMLDivElement,
  showButton?: boolean,
  containerClass?: string,
  position?: "top" | "left" | "right" | "bottom",
};


export class ElevationProfileControl implements IControl {
  private map?: Map;
  private buttonContainer?: HTMLDivElement;
  private toggleButton?: HTMLButtonElement;
  private isProfileShown: boolean = false;
  private iconSpan?: HTMLSpanElement;

  private profileContainer?: HTMLDivElement;
  private settings: ElevationProfileControlOptions;
  private data: GeoJsonObject | null = null;
  private elevationProfileChart?: ElevationProfile;

  constructor(options: ElevationProfileControlOptions = {}) {
    this.settings = options;
  }

  getContainer(): HTMLDivElement | undefined {
    return this.profileContainer;
  }


  onAdd(map: Map): HTMLElement {
    this.map = map;
  
    this.buttonContainer = document.createElement("div");

    if (this.settings.showButton === false) {
      this.buttonContainer.style.setProperty("display", "none");
    }

    this.buttonContainer.classList.add("maplibregl-ctrl", "maplibregl-ctrl-group");
    this.toggleButton = document.createElement("button");
    this.buttonContainer.appendChild(this.toggleButton);
    this.iconSpan = document.createElement("span");
    this.iconSpan.classList.add("maplibregl-ctrl-icon");
    this.toggleButton.appendChild(this.iconSpan);
    this.iconSpan.style.setProperty("background-image", `url(${elevationIcon})`);
    this.toggleButton.addEventListener("click", this.toggleProfile.bind(this));



    const mapContainer = map.getContainer();

    if (this.settings.container) {
      const tmpContainer = typeof this.settings.container === "string" ? document.getElementById(this.settings.container) : this.settings.container;
      if (!tmpContainer) throw new Error("The provided container is invalid");
      this.profileContainer = tmpContainer as HTMLDivElement;
      console.log("this.profileContainer", this.profileContainer);
      
    } else {
      this.profileContainer = document.createElement("div");
      this.profileContainer.style.setProperty("display", "none");
      this.profileContainer.style.setProperty("background", "white");
      this.profileContainer.style.setProperty("z-index", "3");
      this.profileContainer.style.setProperty("position", "absolute");

      if (this.settings.position === "bottom" || !this.settings.position) {
        this.profileContainer.style.setProperty("width", "100%");
        this.profileContainer.style.setProperty("height", "30%");
        this.profileContainer.style.setProperty("bottom", "0");
      } else if (this.settings.position === "top") {
        this.profileContainer.style.setProperty("width", "100%");
        this.profileContainer.style.setProperty("height", "30%");
        this.profileContainer.style.setProperty("top", "0");
      } else if (this.settings.position === "left") {
        this.profileContainer.style.setProperty("width", "30%");
        this.profileContainer.style.setProperty("height", "100%");
        this.profileContainer.style.setProperty("left", "0");
      } else if (this.settings.position === "right") {
        this.profileContainer.style.setProperty("width", "30%");
        this.profileContainer.style.setProperty("height", "100%");
        this.profileContainer.style.setProperty("right", "0");
      }
      mapContainer.appendChild(this.profileContainer);
    }

    if (this.settings.containerClass) {
      this.profileContainer.classList.add(this.settings.containerClass)
    }

    
    this.elevationProfileChart = new ElevationProfile(this.profileContainer, map.getSdkConfig().apiKey, this.settings);
  
    return this.buttonContainer;
  }


  private toggleProfile() {
    if (!this.profileContainer) return;

    if (this.isProfileShown) {
      this.hideProfile();
    } else {
      this.showProfile()
    }
  }


  showProfile() {
    this.profileContainer?.style.setProperty("display", "inherit");
    this.iconSpan?.style.setProperty("background-image", `url(${elevationFillIcon})`);
    this.isProfileShown = true;
  }

  hideProfile() {
    this.profileContainer?.style.setProperty("display", "none");
    this.iconSpan?.style.setProperty("background-image", `url(${elevationIcon})`);
    this.isProfileShown = false;
  }





  onRemove(_map: Map): void {    
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
      throw new Error("The Elevation Profile Control needs to be mounted on a map instance before setting any data.");
    }

    if (typeof data === "string") {
      let url = isUUID(data) ? `https://api.maptiler.com/data/${data}/features.json?key=${this.map.getSdkConfig().apiKey}` : data;
      const routeRes = await fetch(url);
      this.data = await routeRes.json()
    } else {
      this.data = data;
    }

    if (!this.data) return;

    this.elevationProfileChart.setData(this.data);
  }

}