import type {
  GeoJsonObject,
  GeometryObject,
  LineString,
  MultiLineString,
  Feature,
  FeatureCollection,
  Position,
} from "geojson";

import { Chart, registerables } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import {
  // @ts-ignore
  CrosshairPlugin,
} from "chartjs-plugin-crosshair";

import { elevation, math, config } from "@maptiler/sdk";

const FEET_PER_METER = 3.28084;
const MILES_PER_METER = 0.000621371;

function extractLineStrings(
  geoJson: GeoJsonObject
): Array<LineString | MultiLineString> {
  const lineStrings: Array<LineString | MultiLineString> = [];

  function extractFromGeometry(geometry: GeometryObject) {
    if (geometry.type === "LineString" || geometry.type === "MultiLineString") {
      lineStrings.push(geometry as LineString | MultiLineString);
    }
  }

  function extractFromFeature(feature: Feature) {
    if (feature.geometry) {
      extractFromGeometry(feature.geometry);
    }
  }

  function extractFromFeatureCollection(collection: FeatureCollection) {
    for (const feature of collection.features) {
      if (feature.type === "Feature") {
        extractFromFeature(feature);
      } else if (feature.type === "FeatureCollection") {
        extractFromFeatureCollection(feature as unknown as FeatureCollection); // had to add unknown
      }
    }
  }

  if (geoJson.type === "Feature") {
    extractFromFeature(geoJson as Feature);
  } else if (geoJson.type === "FeatureCollection") {
    extractFromFeatureCollection(geoJson as FeatureCollection);
  } else {
    // It's a single geometry
    extractFromGeometry(geoJson as GeometryObject);
  }

  return lineStrings;
}

function geoJsonObjectToPositions(geoJson: GeoJsonObject): Position[] {
  const lineStringAndMultiLineStrings = extractLineStrings(geoJson);
  const positionsGroups: Position[][] = [];

  for (let i = 0; i < lineStringAndMultiLineStrings.length; i += 1) {
    const feature = lineStringAndMultiLineStrings[i];
    if (feature.type === "LineString") {
      positionsGroups.push(feature.coordinates);
    } else if (feature.type === "MultiLineString") {
      positionsGroups.push(feature.coordinates.flat());
    }
  }
  return positionsGroups.flat();
}

/**
 * Event data to `onMove` and `onClick` callback
 */
export type CallbackData = {
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

export type ElevationProfileOptions = {
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
};

const elevationProfileDefaultOptions: ElevationProfileOptions = {
  backgroundColor: null,
  unit: "metric",
  fontSize: 12,
  forceComputeElevation: false,
  displayElevationLabels: true,
  displayDistanceLabels: true,
  displayUnits: true,
  labelColor: "#0009",
  profileLineColor: "#66ccff",
  profileLineWidth: 1.5,
  profileBackgroundColor: "#66ccff22",
  displayTooltip: true,
  tooltipTextColor: "#fff",
  tooltipBackgroundColor: "#000A",
  tooltipDisplayDistance: true,
  tooltipDisplayElevation: true,
  tooltipDisplayDPlus: true,
  tooltipDisplayGrade: true,
  displayDistanceGrid: false,
  displayElevationGrid: true,
  distanceGridColor: "#0001",
  elevationGridColor: "#0001",
  displayCrosshair: true,
  crosshairColor: "#0005",
  onChangeView: null,
  paddingTop: 30,
  paddingBottom: 10,
  paddingLeft: 10,
  paddingRight: 10,
  onClick: null,
  onMove: null,
};

/**
 * Elevation profile chart
 */
export class ElevationProfile {
  private canvas: HTMLCanvasElement;
  private settings: ElevationProfileOptions;
  private chart: Chart<"line", Array<number>, number>;
  private elevatedPositions: Position[] = [];
  private elevatedPositionsAdjustedUnit: Position[] = [];
  private cumulatedDistance: number[] = [];
  private cumulatedDistanceAdjustedUnit: number[] = [];
  private cumulatedDPlus: number[] = [];
  private grade: number[] = [];

  constructor(
    /**
     * DIV element to place the chart into
     */
    container: HTMLDivElement | string,
    /**
     * MapTiler API key. Essential for computing the elevation when missing or forced
     */
    apiKey: string,
    /**
     * Options
     */
    options: ElevationProfileOptions = {}
  ) {
    // Set API key
    config.apiKey = apiKey;

    const appContainer =
      typeof container === "string"
        ? document.getElementById(container)
        : container;
    if (!appContainer) {
      throw new Error("The container does not exist.");
    }

    this.canvas = document.createElement("canvas");
    appContainer.appendChild(this.canvas);

    Chart.register(...registerables);
    Chart.register(zoomPlugin);
    Chart.register(CrosshairPlugin);

    this.settings = {
      ...elevationProfileDefaultOptions,
      ...options,
    };

    // const gradeColor = [
    //   "#02b305", // 0% and less
    //   "#60b302", // 1
    //   "#95b302", // 2
    //   "#e3d405", // 3
    //   "#f0bd05", // 4
    //   "#faa507", // 5
    //   "#fa8507", // 6
    //   "#fa6c07", // 7
    //   "#fa5007", // 8
    //   "#fa3407", // 9
    //   "#fa0707", // 10
    //   "#b00000", // more than 10%
    // ]

    const distanceUnit = this.settings.unit === "imperial" ? "mi" : "km";
    const elevationUnit = this.settings.unit === "imperial" ? "ft" : "m";
    Chart.defaults.font.size = this.settings.fontSize;
    this.chart = new Chart<"line", Array<number>, number>(this.canvas, {
      type: "line",

      data: {
        labels: [],
        datasets: [
          {
            label: "Elevation",
            data: [],
            pointRadius: 0,
            fill: !!this.settings.profileBackgroundColor,
            borderColor: this.settings.profileLineColor ?? "#0000",
            backgroundColor: this.settings.profileBackgroundColor ?? "#0000",
            tension: 0.1,
            spanGaps: true,
            // If line color is null, the line width is set to 0
            borderWidth: this.settings.profileLineColor
              ? this.settings.profileLineWidth
              : 0,
            // segment: {
            //   borderColor: (ctx: ScriptableLineSegmentContext) => {
            //     const grade = ~~(this.grade[ctx.p0DataIndex]);
            //     if (grade < 1) return gradeColor[0];
            //     if (grade > 10) return gradeColor[11];
            //     return gradeColor[grade];
            //   }
            // }
          },
        ],
      },

      options: {
        layout: {
          padding: {
            left: this.settings.paddingLeft,
            right: this.settings.paddingRight,
            bottom: this.settings.paddingBottom,
            top: this.settings.paddingTop,
          },
        },
        onClick: (_e, item) => {
          if (typeof this.settings.onClick !== "function") return;

          try {
            const i = item[0].index;

            this.settings.onClick.apply(this, [
              {
                position: this.elevatedPositionsAdjustedUnit[i],
                distance: this.cumulatedDistanceAdjustedUnit[i],
                dPlus: this.cumulatedDPlus[i],
                gradePercent: this.grade[i],
              },
            ]);
          } catch (e) {
            // Nothing to do
          }
        },
        onHover: (_e, item) => {
          if (typeof this.settings.onMove !== "function") return;

          try {
            const i = item[0].index;

            this.settings.onMove.apply(this, [
              {
                position: this.elevatedPositionsAdjustedUnit[i],
                distance: this.cumulatedDistanceAdjustedUnit[i],
                dPlus: this.cumulatedDPlus[i],
                gradePercent: this.grade[i],
              },
            ]);
          } catch (e) {
            // Nothing to do
          }
        },
        animation: false,
        maintainAspectRatio: false,
        scales: {
          x: {
            min: 0,
            max: 0,
            type: "linear",
            grid: {
              display: this.settings.displayDistanceGrid,
              color: this.settings.distanceGridColor,
              drawTicks: false,
            },
            ticks: {
              align: "inner",
              display: this.settings.displayDistanceLabels,
              color: this.settings.labelColor,
              callback: (value) => {
                const roundedValue = ~~((value as number) * 100) / 100;
                return this.settings.displayUnits
                  ? `${roundedValue} ${distanceUnit}`
                  : roundedValue;
              },
            },
          },
          y: {
            min: 0,
            max: 0,
            type: "linear",
            ticks: {
              mirror: true,
              align: "end",
              display: this.settings.displayElevationLabels,
              color: this.settings.labelColor,
              callback: (value) => {
                const roundedValue = ~~((value as number) * 100) / 100;
                return this.settings.displayUnits
                  ? `${roundedValue} ${elevationUnit}`
                  : roundedValue;
              },
            },
            grid: {
              display: this.settings.displayElevationGrid,
              color: this.settings.elevationGridColor,
              drawTicks: false,
            },
          },
        },

        interaction: {
          intersect: false,
          mode: "index",
        },

        plugins: {
          zoom: {
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true,
              },
              mode: "x",
            },
            pan: {
              enabled: true,
              mode: "x",
            },
            limits: {
              x: {
                min: "original",
                max: "original",
              },
            },
          },
          title: {
            display: false,
          },
          legend: {
            display: false,
          },
          tooltip: {
            enabled: this.settings.displayTooltip,
            yAlign: "center",
            cornerRadius: 3,
            displayColors: false,
            backgroundColor: this.settings.tooltipBackgroundColor,
            bodyColor: this.settings.tooltipTextColor,
            callbacks: {
              title: () => {
                return "";
              },

              label: (tooltipItem) => {
                const tooltipInfo = [];
                if (this.settings.tooltipDisplayDistance) {
                  tooltipInfo.push(
                    `Distance: ${this.cumulatedDistanceAdjustedUnit[
                      tooltipItem.dataIndex
                    ].toFixed(4)} ${distanceUnit}`
                  );
                }

                if (this.settings.tooltipDisplayElevation) {
                  tooltipInfo.push(
                    `Elevation: ${this.elevatedPositionsAdjustedUnit[
                      tooltipItem.dataIndex
                    ][2].toFixed(2)} ${elevationUnit}`
                  );
                }

                if (this.settings.tooltipDisplayDPlus) {
                  tooltipInfo.push(
                    `D+: ${this.cumulatedDPlus[tooltipItem.dataIndex].toFixed(
                      0
                    )} ${elevationUnit}`
                  );
                }

                if (this.settings.tooltipDisplayGrade) {
                  tooltipInfo.push(
                    `Grade: ${this.grade[tooltipItem.dataIndex].toFixed(1)}%`
                  );
                }

                return tooltipInfo;
              },
            },
          },

          // The crosshair plugin does not have types
          // @ts-ignore
          crosshair: {
            zoom: {
              enabled: false,
            },
            line: {
              color: this.settings.displayCrosshair
                ? this.settings.crosshairColor
                : "#0000",
              width: 1,
            },
          },
        },
      },

      plugins: [
        {
          id: "customZoomEvent",
          afterDataLimits: () => {
            if (typeof this.settings.onChangeView !== "function") return;
            try {
              this.settings.onChangeView.apply(this, [
                this.createWindowExtractLineString(),
              ]);
            } catch (e) {
              // nothing to do
            }
          },
        },
      ],
    });

    // If the tooltip is shown, then we hide it when panning the chart
    if (this.settings.displayTooltip) {
      let mouseDown = false;
      this.chart.canvas.addEventListener("mousedown", () => {
        mouseDown = true;
      });

      this.chart.canvas.addEventListener("mousemove", () => {
        if (
          mouseDown &&
          this.chart.options.plugins &&
          this.chart.options.plugins.tooltip
        ) {
          this.chart.options.plugins.tooltip.enabled = false;
          this.chart.update();
        }
      });

      window.addEventListener("mouseup", () => {
        if (this.chart.options.plugins?.tooltip) {
          this.chart.options.plugins.tooltip.enabled = true;
          this.chart.update();
          mouseDown = false;
        }
      });
    }
  }

  createWindowExtractLineString(): LineString {
    const scaleMin = this.chart.scales.x.min;
    const scaleMax = this.chart.scales.x.max;

    const cda = this.cumulatedDistanceAdjustedUnit;
    const nbElem = cda.length;

    let indexStart = 0;
    let indexEnd = nbElem - 1;

    // find the start index
    for (let i = 0; i < nbElem; i += 1) {
      if (cda[i] >= scaleMin) {
        indexStart = i;
        break;
      }
    }

    // find the end index
    for (let i = nbElem - 1; i >= indexStart; i -= 1) {
      if (cda[i] <= scaleMax) {
        indexEnd = i;
        break;
      }
    }

    return this.createExtractLineString(indexStart, indexEnd);
  }

  createExtractLineString(fromIndex: number, toIndex: number): LineString {
    const elevatedPositionsWindow: Position[] = this.elevatedPositions.slice(
      fromIndex,
      toIndex
    );

    return {
      type: "LineString",
      coordinates: elevatedPositionsWindow,
    };
  }

  async setData(data: GeoJsonObject | Position[]) {
    // Concatenates the positions that may come from multiple LineStrings or MultiLineString
    const positions: Position[] = Array.isArray(data)
      ? data
      : geoJsonObjectToPositions(data);

    // We can force to fetch the elevations, or it will anyways if one or more positions do not have elevation value
    if (
      this.settings.forceComputeElevation ||
      positions.some((pos) => pos.length === 2)
    ) {
      // Fetch the elevations
      this.elevatedPositions = await elevation.batch(positions, {
        smoothingKernelSize: positions.length / 100,
      });
    } else {
      this.elevatedPositions = positions;
    }

    this.cumulatedDistance = math.haversineCumulatedDistanceWgs84(
      this.elevatedPositions
    );
    this.cumulatedDPlus = [];
    this.grade = [];
    let cumulatedDPlus = 0;

    for (let i = 0; i < this.elevatedPositions.length; i += 1) {
      const elevation = this.elevatedPositions[i][2];

      if (i > 1) {
        const elevationPrevious = this.elevatedPositions[i - 1][2];
        const elevationDelta = elevation - elevationPrevious;
        const segmentDistance =
          this.cumulatedDistance[i] - this.cumulatedDistance[i - 1];
        cumulatedDPlus += Math.max(0, elevationDelta);
        this.cumulatedDPlus.push(cumulatedDPlus);
        this.grade.push(((elevationDelta / segmentDistance) * 1000) / 10);
      }
    }
    this.grade.push(0);
    this.cumulatedDPlus.push(cumulatedDPlus);

    // Conversion of distance to miles and elevation to feet
    if (this.settings.unit === "imperial") {
      this.cumulatedDistanceAdjustedUnit = this.cumulatedDistance.map(
        (dist) => dist * MILES_PER_METER
      );
      this.elevatedPositionsAdjustedUnit = this.elevatedPositions.map((pos) => [
        pos[0],
        pos[1],
        pos[2] * FEET_PER_METER,
      ]);
      this.cumulatedDPlus = this.cumulatedDPlus.map(
        (ele) => ele * FEET_PER_METER
      );
    } else {
      this.cumulatedDistanceAdjustedUnit = this.cumulatedDistance.map(
        (dist) => dist / 1000
      ); // we still need to convert distance to km
      this.elevatedPositionsAdjustedUnit = this.elevatedPositions;
    }

    let minElevation = Number.POSITIVE_INFINITY;
    let maxElevation = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < this.elevatedPositionsAdjustedUnit.length; i += 1) {
      if (this.elevatedPositionsAdjustedUnit[i][2] < minElevation) {
        minElevation = this.elevatedPositionsAdjustedUnit[i][2];
      }

      if (this.elevatedPositionsAdjustedUnit[i][2] > maxElevation) {
        maxElevation = this.elevatedPositionsAdjustedUnit[i][2];
      }
    }

    const elevationPadding = (maxElevation - minElevation) * 0.1;
    this.chart.data.labels = this.cumulatedDistanceAdjustedUnit;
    this.chart.data.datasets[0].data = this.elevatedPositionsAdjustedUnit.map(
      (pos) => pos[2]
    );

    if (
      this.chart.options.scales?.x &&
      this.chart.options.scales.y
    ) {
      this.chart.options.scales.x.min = this.cumulatedDistanceAdjustedUnit[0];
      this.chart.options.scales.x.max =
        this.cumulatedDistanceAdjustedUnit[
          this.cumulatedDistanceAdjustedUnit.length - 1
        ];
      this.chart.options.scales.y.min = minElevation - elevationPadding;
      this.chart.options.scales.y.max = maxElevation + elevationPadding;
    }

    this.chart.update();
  }
}
