import { ControlPosition, IControl, Map } from "@maptiler/sdk";
import { ElevationProfileOptions } from "./elevationprofile";
// @ts-ignore
import elevationIcon from "./images/elevation-icon.svg";


export type ElevationProfileControlOptions = ElevationProfileOptions & {

}


export class ElevationProfileControl implements IControl {
  private map?: Map;
  private buttonContainer?: HTMLDivElement;
  private toggleButton?: HTMLButtonElement;
  private isProfileShown: boolean = false;

  constructor(options: ElevationProfileControlOptions) {
    console.log("options", options);
    
  }

  onAdd(map: Map): HTMLElement {
    this.map = map;
    console.log("map", this.map);
    

    this.buttonContainer = document.createElement("div");
    this.buttonContainer.classList.add("maplibregl-ctrl", "maplibregl-ctrl-group");

    this.toggleButton = document.createElement("button");
    
    // this.toggleButton.classList.add("maplibregl-ctrl-icon");
    this.buttonContainer.appendChild(this.toggleButton);

    const span = document.createElement("span");
    span.classList.add("maplibregl-ctrl-icon");
    this.toggleButton.appendChild(span);
    span.style.setProperty("background-image", `url(${elevationIcon})`);
    this.toggleButton.addEventListener("click", this.toggleProfile.bind(this));


    return this.buttonContainer;
  }


  private toggleProfile() {

    if (this.isProfileShown) {
      console.log("Should hide profile");
    } else {
      console.log("Should show profile");
    }

    this.isProfileShown = !this.isProfileShown;

  }





  onRemove(map: Map): void {
    console.log("map", map);
    
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

}