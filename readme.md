<img src="images/maptiler-epc-logo.svg" alt="Company Logo" height="32"/>

# Elevation Profile Control

The elevation profile control is a super easy way to show the elevation profile of any GeoJSON trace, whether it's a `LineString`, a `MultiLineString`, whether or not it's encapsulated in a `Feature` or `FeatureCollection`. In case multiple features are eligible in the provided dataset, they will be concatenated and displayed together as a unique route.

It can be customized in many ways and is compatible with both **metric** and **imperial** units. Yet, it comes with many built-in defaults, and does not need a lot to look nice! Here is how the most minimalist setup looks like, featuring **zooming** and **panning** of the profile.

[![](https://img.shields.io/npm/v/@maptiler/elevation-profile-control?style=for-the-badge&labelColor=D3DBEC&color=f2f6ff&logo=npm&logoColor=333359)](https://www.npmjs.com/package/@maptiler/elevation-profile-control) ![](https://img.shields.io/badge/-white?style=for-the-badge&logo=javascript)![](https://img.shields.io/badge/-white?style=for-the-badge&logo=typescript)

---

📖 [Documentation](https://docs.maptiler.com/sdk-js/modules/elevation-profile/) &nbsp; 📦 [NPM Package](https://www.npmjs.com/package/@maptiler/elevation-profile-control) &nbsp; 🌐 [Website](https://docs.maptiler.com/sdk-js/modules/elevation-profile/) &nbsp; 🔑 [Get API Key](https://cloud.maptiler.com/account/keys/)

---
<br>

<details> <summary><b>Table of Contents</b></summary>
<ul>
<li><a href="#-installation">Installation</a></li>
<li><a href="#-basic-usage">Basic Usage</a></li>
<li><a href="#-related-examples">Examples</a></li>
<li><a href="#-api-reference">API Reference</a></li>
<li><a href="#-support">Support</a></li>
<li><a href="#-contributing">Contributing</a></li>
<li><a href="#-license">License</a></li>
<li><a href="#-acknowledgements">Acknowledgements</a></li>
</ul>
</details>

<p align="center">   <img src="images/basic.png" alt="Demo Screenshot" width="80%"/>  <br />  <a href="https://docs.maptiler.com/sdk-js/examples/elevation-profile-control-simple/">See live interactive demo</a> </p>
<br>

## 📦 Installation

```shell
npm install @maptiler @maptiler/elevation-profile-control
```

<br>

## 🚀 Basic Usage

``` js
import { Map, MapStyle, config, helpers } from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { ElevationProfileControl } from '@maptiler/elevation-profile-control';

config.apiKey = 'YOUR_MAPTILER_API_KEY_HERE';
const map = new Map({
  container: 'map', // container's id or the HTML element in which the SDK will render the map
  style: MapStyle.OUTDOOR,
  center: [0.57705, 42.68311], // starting position [lng, lat]
  zoom: 12.22, // starting zoom
});

map.on('ready', () => {
  helpers.addPolyline(map, {
    data: 'YOUR_MAPTILER_DATASET_ID_HERE', //from a URL or a MapTiler Data UUID
    lineColor: '#66f',
    lineWidth: 4,
    outline: true,
    outlineWidth: 2
  });

  // Create an instance
  const epc = new ElevationProfileControl({
    visible: true
  });

  // Add it to your map
  map.addControl(epc);

  // Add some data (from a URL or a MapTiler Data UUID)
  epc.setData('YOUR_MAPTILER_DATASET_ID_HERE');
});
```

<br>

## 💡 Related Examples

- [Show the trace position with Elevation profile control](https://docs.maptiler.com/sdk-js/examples/elevation-profile-control-marker/)
- [How to display GPX track elevation profile](https://docs.maptiler.com/sdk-js/examples/elevation-profile-control-gpx/)
- [Customize Elevation profile control](https://docs.maptiler.com/sdk-js/examples/elevation-profile-control-customized/)

Check out the full list of [MapTiler examples](https://docs.maptiler.com/sdk-js/examples/?q=elevation+profile)

<br>

## 📘 API Reference

For detailed guides, API reference, and advanced examples, visit our comprehensive documentation:

[API documentation](https://docs.maptiler.com/sdk-js/modules/elevation-profile/api/api-reference/)

### Styling
As many MapTiler SDK (or MapLibre) controls, it is made available with a button on top of the map. By default, the elevation profile chart will also be displayed on top of the map. Yet, you can customize how you want to achieve that.

The following configuration makes the chart sticking to the left, partially transparent to reveal the map underneath:

```ts
const epc = new maptilerelevationprofilecontrol.ElevationProfileControl({
  visible: true, // no need to click, it's there by default
  position: "left",
  backgroundColor: "#0005",
  labelColor: "#FFF6",
  size: "50%", // Take half of the room available (default is 30%)
  elevationGridColor: "#FFF1",
  tooltipTextColor: "#000b",
  tooltipBackgroundColor: "#eeea",
  profileLineColor: "#a103fc",
  profileBackgroundColor: "#a103fc11",
});
```
Here is the result:
![](images/custom-style.png)

A second options to achieve even more custom styling is to use the option `containerClass`. This way, almost all the styling is achieved at application level (rather than internally by the control itself), yet the container is still created by the control. Here is an example:

```ts
const epc = new maptilerelevationprofilecontrol.ElevationProfileControl({
  visible: true,
  // since the text is drawn in the canvas, 
  // it still has to be tuned here:
  fontSize: 9,
  containerClass: "profileContainer",
});
```

Here is the `profileContainer` style definition in CSS:
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.profileContainer {
  background-color: #fff;
  height: 200px;
  width: 60%;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 3px;
  margin: 20px auto;
  filter: drop-shadow(0px 0px 15px #00000066);
  animation: fadeIn 0.5s ease forwards;
}
```
Here is the result:
![](images/custom-class.png)

A third way to achieve customization with an even higher level of freedom, is to use the `container` options. Instead of creating the container, the Control will use an existing one, and not alter its styling of the container at all. Here is an example of how to achieve that:
```ts
const epc = new maptilerelevationprofilecontrol.ElevationProfileControl({
  unit: "imperial",
  container: "profileContainer",
  showButton: false,
  labelColor: "#FFF6",
  elevationGridColor: "#FFF1",
  tooltipTextColor: "#000b",
  tooltipBackgroundColor: "#eeea",
  profileLineColor: "#a103fc",
  profileBackgroundColor: "#a103fc11",
  crosshairColor: "#66f5",
  displayTooltip: true,
});
```
For the sake of a better-looking example, the example also comes with some custom colors. Here is how it looks like:
![](images/custom-div.png)

As you can see, the option `showButton` is `false` and as a result, the control button is not showing on top of the map. This can be convenient in such case because we can imagine the container being fully managed at application level.

### Computing Elevation
In some cases, the route data passed to the method `.setData()` will contain only *longitude* and *latitude* information, but no elevation. In that case, the control will automatically fetch and compute the elevation data prior to display the profile. Under the hood, this operation is performed by the [MapTiler Client library](https://docs.maptiler.com/client-js/).

### Events
There are three events available that can be defined in the constructor options:
- `onMove` when moving the pointer on top of the profile
- `onClick` when clicking on the profile
- `onChangeView` when zooming or panning the profile

With the event `onMove` we can easily display a marker moving on top of the map. With the event `onChangeView`, we have access to a GeoJSON *LineString* corresponding to the zoomed section, that we can then display on top of the full-length route:
![](images/section.png)

(Note: this can easily be achieved with the *Polyline Helper* available in the MapTiler SDK)

### All the options
<details>
  <summary>Know more about ElevationProfileControl constructor options</summary>

The constructor `ElevationProfileControl` can have many options, for instance, displaying the elevation line in red:

```ts
const epc = new ElevationProfileControl({ profileLineColor: "red" });
```

Below is the complete list of options:
```ts
{
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
  /**
   * Color of the background of the chart
   */
  backgroundColor?: string | null;
  /**
   * Unit system to use.
   * If "metric", elevation and D+ will be in meters, distances will be in km.
   * If "imperial", elevation and D+ will be in feet, distances will be in miles.
   *
   * Default: "metric"
   */
  unit?: "metric" | "imperial";
  /**
   * Font size applied to axes labels and tooltip.
   *
   * Default: `12`
   */
  fontSize?: number;
  /**
   * If `true`, will force the computation of the elevation of the GeoJSON data provided to the `.setData()` method,
   * even if they already contain elevation (possibly from GPS while recording). If `false`, the elevation will only
   * be computed if missing from the positions.
   *
   * Default: `false`
   */
  forceComputeElevation?: boolean;
  /**
   * Display the elevation label along the vertical axis.
   *
   * Default: `true`
   */
  displayElevationLabels?: boolean;
  /**
   * Display the distance labels alon the horizontal axis.
   *
   * Default: `true`
   */
  displayDistanceLabels?: boolean;
  /**
   * Display the distance and elevation units alongside the labels.
   *
   * Default: `true`
   */
  displayUnits?: boolean;
  /**
   * Color of the elevation and distance labels.
   *
   * Default: `"#0009"` (partially transparent black)
   */
  labelColor?: string;
  /**
   * Color of the elevation profile line.
   * Can be `null` to not display the line and rely on the background color only.
   *
   * Default: `"#66ccff"`
   */
  profileLineColor?: string | null;
  /**
   * Width of the elevation profile line.
   *
   * Default: `1.5`
   */
  profileLineWidth?: number;
  /**
   * Color of the elevation profile background (below the profile line)
   * Can be `null` to not display any backgound color.
   *
   * Default: `"#66ccff22"`
   */
  profileBackgroundColor?: string | null;
  /**
   * Display the tooltip folowing the pointer.
   *
   * Default: `true`
   */
  displayTooltip?: boolean;
  /**
   * Color of the text inside the tooltip.
   *
   * Default: `"#fff"`
   */
  tooltipTextColor?: string;
  /**
   * Color of the tooltip background.
   *
   * Default: `"#000A"` (partially transparent black)
   */
  tooltipBackgroundColor?: string;
  /**
   * Display the distance information inside the tooltip if `true`.
   *
   * Default: `true`
   */
  tooltipDisplayDistance?: boolean;
  /**
   * Display the elevation information inside the tooltip if `true`.
   *
   * Default: `true`
   */
  tooltipDisplayElevation?: boolean;
  /**
   * Display the D+ (cumulated positive ascent) inside the tooltip if `true`.
   *
   * Default: `true`
   */
  tooltipDisplayDPlus?: boolean;
  /**
   * Display the slope grade in percentage inside the tooltip if `true`.
   *
   * Default: `true`
   */
  tooltipDisplayGrade?: boolean;
  /**
   * Display the distance grid lines (vertical lines matching the distance labels) if `true`.
   *
   * Default: `false`
   */
  displayDistanceGrid?: boolean;
  /**
   * Display the elevation grid lines (horizontal lines matching the elevation labels) if `true`.
   *
   * Default: `true`
   */
  displayElevationGrid?: boolean;
  /**
   * Color of the distance grid lines.
   *
   * Default: `"#0001"` (partially transparent black)
   */
  distanceGridColor?: string;
  /**
   * Color of the elevation drig lines.
   *
   * Default: `"#0001"` (partially transparent black)
   */
  elevationGridColor?: string;
  /**
   * Padding at the top of the chart, in number of pixels.
   *
   * Default: `30`
   */
  paddingTop?: number;
  /**
   * Padding at the bottom of the chart, in number of pixels.
   *
   * Default: `10`
   */
  paddingBottom?: number;
  /**
   * Padding at the left of the chart, in number of pixels.
   *
   * Default: `10`
   */
  paddingLeft?: number;
  /**
   * Padding at the right of the chart, in number of pixels.
   *
   * Default: `10`
   */
  paddingRight?: number;
  /**
   * Display the crosshair, a vertical line that follows the pointer, if `true`.
   *
   * Default: `true`
   */
  displayCrosshair?: boolean;
  /**
   * Color of the crosshair.
   *
   * Default: `"#0005"` (partially transparent black)
   */
  crosshairColor?: string;
  /**
   * Callback function to call when the chart is zoomed or panned.
   * The argument `windowedLineString` is the GeoJSON LineString corresponding
   * to the portion of the route visible in the elevation chart.
   *
   * Default: `null`
   */
  onChangeView?: ((windowedLineString: LineString) => void) | null;
  /**
   * Callback function to call when the the elevation chart is clicked.
   *
   * Default: `null`
   */
  onClick?: ((data: CallbackData) => void) | null;
  /**
   * Callback function to call when the pointer is moving on the elevation chart.
   *
   * Default: `null`
   */
  onMove?: ((data: CallbackData) => void) | null;
}
```

With `CallbackData` being:
```ts
{
  /**
   * The position as `[lon, lat, elevation]`.
   * Elevation will be in meters if the component has been set with the unit "metric" (default)
   * of in feet if the unit is "imperial".
   */
  position: Position;
  /**
   * The distance from the start of the route. In km if the component has been set with the unit "metric" (default)
   * of in miles if the unit is "imperial".
   */
  distance: number;
  /**
   * Cumulated positive elevation from the begining of the route up to this location.
   * In meters if the component has been set with the unit "metric" (default)
   * of in feet if the unit is "imperial".
   */
  dPlus: number;
  /**
   * Slope grade in percentage (1% being a increase of 1m on a 100m distance)
   */
  gradePercent: number;
};
```
</details>

<br>

## 💬 Support

- 📚 [Documentation](https://docs.maptiler.com/sdk-js/modules/elevation-profile/) - Comprehensive guides and API reference
- ✉️ [Contact us](https://maptiler.com/contact) - Get in touch or submit a request
- 🐦 [Twitter/X](https://twitter.com/maptiler) - Follow us for updates

<br>

---

<br>

## 🤝 Contributing

We love contributions from the community! Whether it's bug reports, feature requests, or pull requests, all contributions are welcome:

- Fork the repository and create your branch from `main`
- If you've added code, add tests that cover your changes
- Ensure your code follows our style guidelines
- Give your pull request a clear, descriptive summary
- Open a Pull Request with a comprehensive description

<br>

## 📄 License

This project is licensed under the MapTiler JS Module License – see the [LICENSE](./LICENSE.md) file for details.

<br>

## 🙏 Acknowledgements

This project is built on the shoulders of giants:

- [MapTiler SDK JS](https://docs.maptiler.com/sdk-js/) – The open-source mapping library
- [chart.js](https://www.chartjs.org/) – Simple yet flexible JavaScript charting library for the modern web

<br>

<p align="center" style="margin-top:20px;margin-bottom:20px;"> <a href="https://cloud.maptiler.com/account/keys/" style="display:inline-block;padding:12px 32px;background:#F2F6FF;color:#000;font-weight:bold;border-radius:6px;text-decoration:none;"> Get Your API Key <sup style="background-color:#0000ff;color:#fff;padding:2px 6px;font-size:12px;border-radius:3px;">FREE</sup><br /> <span style="font-size:90%;font-weight:400;">Start building with 100,000 free map loads per month ・ No credit card required.</span> </a> </p>

<br>

<p align="center"> 💜 Made with love by the <a href="https://www.maptiler.com/">MapTiler</a> team <br />
<p align="center">
  <a href="https://docs.maptiler.com/sdk-js/modules/elevation-profile/">Website</a> •
  <a href="https://docs.maptiler.com/sdk-js/modules/elevation-profile/">Documentation</a> •
  <a href="https://github.com/maptiler/maptiler-elevation-profile-control">GitHub</a>
</p>