import {
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

import { elevation, math, config } from "@maptiler/client";

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

export type CallbackData = {
  positions: Position;
  distance: number;
  dPlus: number;
  gradePercent: number;
};

export type ElevationProfileOptions = {
  backgroundColor?: string | null;

  unit?: "metric" | "imperial";

  forceFetchElevation?: boolean;

  displayElevationTicks?: boolean;
  displayDistanceTicks?: boolean;
  displayTickUnit?: boolean;
  tickTextColor?: string;

  profileLineColor?: string | null;
  profileLineWidth?: number;
  profileBackgroundColor?: string | null;

  displayTooltip?: boolean;
  tooltipTextColor?: string;
  tooltipBackgroundColor?: string;
  tooltipDisplayDistance?: boolean;
  tooltipDisplayElevation?: boolean;
  tooltipDisplayDPlus?: boolean;
  tooltipDisplayGrade?: boolean;

  displayDistanceGrid?: boolean;
  displayElevationGrid?: boolean;
  distanceGridColor?: string;
  elevationGridColor?: string;

  displayCrosshair?: boolean;
  crosshairColor?: string;

  onChangeView?: ((windowedLineString: LineString) => void) | null;
  onClick?: ((data: CallbackData) => void) | null;
  onMove?: ((data: CallbackData) => void) | null;
};

const elevationProfileDefaultOptions: ElevationProfileOptions = {
  backgroundColor: null,
  unit: "metric",

  forceFetchElevation: false,

  displayElevationTicks: true,
  displayDistanceTicks: true,
  displayTickUnit: true,
  tickTextColor: "#0009",

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
  onClick: null,
  onMove: null,
};

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
    container: HTMLDivElement | string,
    apiKey: string,
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
            left: 10,
            right: 10,
            bottom: 10,
            top: 30,
          },
        },
        onClick: (_e, item) => {
          if (typeof this.settings.onClick !== "function") return;

          try {
            const i = item[0].index;

            this.settings.onClick.apply(this, [
              {
                positions: this.elevatedPositionsAdjustedUnit[i],
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
                positions: this.elevatedPositionsAdjustedUnit[i],
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
              display: this.settings.displayElevationTicks,
              color: this.settings.tickTextColor,
            },
          },
          y: {
            min: 0,
            max: 0,
            type: "linear",
            ticks: {
              mirror: true,
              align: "end",
              display: this.settings.displayDistanceTicks,
              color: this.settings.tickTextColor,
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
          id: "customCanvasBackgroundColor",
          beforeDraw: (chart) => {
            if (!this.settings.backgroundColor) return;
            const { ctx } = chart;
            ctx.save();
            ctx.globalCompositeOperation = "destination-over";
            ctx.fillStyle = this.settings.backgroundColor;
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
          },
        },

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
        if (mouseDown && this.chart.options.plugins && this.chart.options.plugins.tooltip) {
          this.chart.options.plugins.tooltip.enabled = false;
          this.chart.update();
        }
      });

      window.addEventListener("mouseup" , () => {
        if (this.chart.options.plugins && this.chart.options.plugins.tooltip) {
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
      this.settings.forceFetchElevation ||
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

    let minElevation = +Infinity;
    let maxElevation = -Infinity;

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
      this.chart.options.scales &&
      this.chart.options.scales.x &&
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
