import { z } from "zod";
import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import type { RecipeDefinition } from "@/lib/recipes/types";
import { PreSatori } from "@/utils/pre-satori";
import getWorldCupData, { type WorldCupData } from "./getData";

export const paramsSchema = z.object({});

const matchSchema = z.object({
	home: z.string().default("—"),
	away: z.string().default("—"),
	homeScore: z.string().default(""),
	awayScore: z.string().default(""),
	state: z.string().default("pre"),
	detail: z.string().default(""),
	live: z.boolean().default(false),
});

export const dataSchema = z.object({
	title: z.string().default("FIFA WORLD CUP"),
	dateLabel: z.string().default(""),
	matches: z.array(matchSchema).default([]),
	message: z.string().optional(),
});

type WorldCupProps = Partial<WorldCupData> & {
	width?: number;
	height?: number;
};

export default function WorldCup({
	title = "FIFA WORLD CUP",
	dateLabel = "",
	matches = [],
	message,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
}: WorldCupProps) {
	const PAD = 28;

	// ----- empty / error state — centered message. -----
	if (message || matches.length === 0) {
		return (
			<PreSatori width={width} height={height}>
				<div
					className="bg-white text-black font-blockKie"
					style={{
						display: "flex",
						flexDirection: "column",
						width,
						height,
						alignItems: "center",
						justifyContent: "center",
						padding: 40,
						textAlign: "center",
					}}
				>
					<div style={{ display: "flex", fontSize: 30, letterSpacing: 2 }}>
						{title}
					</div>
					<div
						className="font-inter"
						style={{ display: "flex", fontSize: 24, marginTop: 18 }}
					>
						{message || "No matches scheduled."}
					</div>
				</div>
			</PreSatori>
		);
	}

	const rowH = Math.floor(
		(height - PAD * 2 - 64) / Math.max(matches.length, 1),
	);

	return (
		<PreSatori width={width} height={height}>
			<div
				className="bg-white text-black"
				style={{
					display: "flex",
					flexDirection: "column",
					width,
					height,
					boxSizing: "border-box",
					padding: PAD,
				}}
			>
				{/* ============ header ============ */}
				<div
					style={{
						display: "flex",
						alignItems: "baseline",
						justifyContent: "space-between",
					}}
				>
					<div
						className="font-blockKie"
						style={{ display: "flex", fontSize: 34, letterSpacing: 2 }}
					>
						{title}
					</div>
					{dateLabel ? (
						<div
							className="font-inter"
							style={{ display: "flex", fontSize: 20, letterSpacing: 1 }}
						>
							{dateLabel}
						</div>
					) : null}
				</div>
				<div
					style={{
						display: "flex",
						height: 5,
						backgroundColor: "#000",
						marginTop: 8,
						marginBottom: 4,
					}}
				/>

				{/* ============ match rows ============ */}
				<div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
					{matches.map((m, i) => {
						const isPre = m.state === "pre";
						return (
							<div
								key={`${m.home}-${m.away}-${i}`}
								style={{
									display: "flex",
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "space-between",
									height: rowH,
									borderBottom:
										i === matches.length - 1 ? "none" : "2px solid #000",
								}}
							>
								{/* live marker + scoreline */}
								<div
									style={{
										display: "flex",
										flexDirection: "row",
										alignItems: "center",
									}}
								>
									<div
										style={{
											display: "flex",
											width: 14,
											height: 14,
											marginRight: 12,
											backgroundColor: m.live ? "#000" : "#fff",
										}}
									/>
									<div
										className="font-inter"
										style={{
											display: "flex",
											width: 92,
											justifyContent: "flex-end",
											fontSize: 28,
										}}
									>
										{m.home}
									</div>
									<div
										className="font-blockKie"
										style={{
											display: "flex",
											width: 104,
											justifyContent: "center",
											fontSize: isPre ? 22 : 30,
										}}
									>
										{isPre ? "vs" : `${m.homeScore} – ${m.awayScore}`}
									</div>
									<div
										className="font-inter"
										style={{
											display: "flex",
											width: 92,
											justifyContent: "flex-start",
											fontSize: 28,
										}}
									>
										{m.away}
									</div>
								</div>

								{/* status: live = inverted pill, else plain */}
								{m.live ? (
									<div
										className="font-inter"
										style={{
											display: "flex",
											alignItems: "center",
											backgroundColor: "#000",
											color: "#fff",
											padding: "4px 12px",
											fontSize: 20,
											letterSpacing: 1,
										}}
									>
										{`LIVE ${m.detail}`.trim()}
									</div>
								) : (
									<div
										className="font-inter"
										style={{
											display: "flex",
											fontSize: 20,
											letterSpacing: 1,
										}}
									>
										{m.detail}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</PreSatori>
	);
}

export const definition: RecipeDefinition<
	typeof paramsSchema,
	typeof dataSchema
> = {
	meta: {
		slug: "world-cup",
		title: "World Cup",
		description:
			"Today's FIFA World Cup matches with live scores, ordered live first.",
		published: true,
		tags: ["sports", "football", "soccer", "api", "live-data"],
		author: { name: "byos", github: "byos" },
		category: "display-components",
		version: "0.1.0",
		createdAt: "2026-06-25T00:00:00Z",
		updatedAt: "2026-06-25T00:00:00Z",
		renderSettings: { supersample: true },
	},
	paramsSchema,
	dataSchema,
	getData: async () => getWorldCupData(),
	Component: ({ width, height, data }) => (
		<WorldCup {...(data as WorldCupData)} width={width} height={height} />
	),
};
