import { z } from "zod";
import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import type { RecipeDefinition } from "@/lib/recipes/types";
import { PreSatori } from "@/utils/pre-satori";
import getWorldCupData, { type WorldCupData } from "./getData";

export const paramsSchema = z.object({
	timezone: z
		.string()
		.default("Asia/Beirut")
		.describe('IANA timezone for match times, e.g. "Asia/Beirut"')
		.meta({ title: "Timezone" }),
});

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
	updatedLabel: z.string().default(""),
	matches: z.array(matchSchema).default([]),
	message: z.string().optional(),
});

type WorldCupProps = Partial<WorldCupData> & {
	width?: number;
	height?: number;
};

const SIDE = 26;
const LABEL = { letterSpacing: 2 } as const;

// Checkered-flag strip — alternating black/white squares in `rows` rows,
// offset per row so it reads as a finish-line flag. Pure flexbox (takumi-safe).
function CheckerStrip({
	width,
	square = 10,
	rows = 2,
}: {
	width: number;
	square?: number;
	rows?: number;
}) {
	const cols = Math.ceil(width / square);
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width,
				height: square * rows,
				overflow: "hidden",
			}}
		>
			{Array.from({ length: rows }).map((_, r) => (
				<div
					key={`r${r}`}
					style={{ display: "flex", flexDirection: "row", height: square }}
				>
					{Array.from({ length: cols }).map((_, c) => (
						<div
							key={`c${c}`}
							style={{
								display: "flex",
								flex: "none",
								width: square,
								height: square,
								backgroundColor: (r + c) % 2 === 0 ? "#000" : "#fff",
							}}
						/>
					))}
				</div>
			))}
		</div>
	);
}

// Soccer-ball mark (white, for the black masthead): outline circle, a filled
// center pentagon, and spokes to the rim. SVG children grouped in <g>.
function BallMark({ size = 30 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 32 32"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="football"
		>
			<title>football</title>
			<g fill="none" stroke="#fff" strokeWidth={2} strokeLinejoin="round">
				<circle cx="16" cy="16" r="13" />
				<path d="M16 8 L22 12.5 L19.7 19.5 L12.3 19.5 L10 12.5 Z" fill="#fff" />
				<path d="M16 8 L16 3 M22 12.5 L26.5 10.5 M19.7 19.5 L23 24.5 M12.3 19.5 L9 24.5 M10 12.5 L5.5 10.5" />
			</g>
		</svg>
	);
}

function Masthead({ title, dateLabel }: { title: string; dateLabel: string }) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
				height: 66,
				backgroundColor: "#000",
				color: "#fff",
				padding: `0 ${SIDE}px`,
				borderBottom: "2px solid #fff",
			}}
		>
			<div
				style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
			>
				<BallMark size={30} />
				<div
					className="font-blockKie"
					style={{
						display: "flex",
						fontSize: 32,
						letterSpacing: 2,
						marginLeft: 16,
					}}
				>
					{title}
				</div>
			</div>
			{dateLabel ? (
				<div
					className="font-geneva9"
					style={{ display: "flex", fontSize: 17, ...LABEL }}
				>
					{dateLabel}
				</div>
			) : null}
		</div>
	);
}

export default function WorldCup({
	title = "FIFA WORLD CUP",
	dateLabel = "",
	updatedLabel = "",
	matches = [],
	message,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
}: WorldCupProps) {
	// ----- empty / error state — framed masthead + centered message. -----
	if (message || matches.length === 0) {
		return (
			<PreSatori width={width} height={height}>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						width,
						height,
						backgroundColor: "#fff",
						color: "#000",
					}}
				>
					<CheckerStrip width={width} />
					<Masthead title={title} dateLabel={dateLabel} />
					<div
						style={{
							display: "flex",
							flex: 1,
							alignItems: "center",
							justifyContent: "center",
							padding: 40,
						}}
					>
						<div
							className="font-blockKie"
							style={{ display: "flex", fontSize: 26, textAlign: "center" }}
						>
							{message || "No matches scheduled."}
						</div>
					</div>
					<CheckerStrip width={width} />
				</div>
			</PreSatori>
		);
	}

	return (
		<PreSatori width={width} height={height}>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					width,
					height,
					backgroundColor: "#fff",
					color: "#000",
				}}
			>
				<CheckerStrip width={width} />
				<Masthead title={title} dateLabel={dateLabel} />

				{/* ================= match rows ================= */}
				<div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
					{matches.map((m, i) => {
						const isPre = m.state === "pre";
						const fg = m.live ? "#fff" : "#000";
						const scoreSize = m.live ? 40 : isPre ? 22 : 34;
						return (
							<div
								key={`${m.home}-${m.away}-${i}`}
								style={{
									display: "flex",
									flexDirection: "row",
									alignItems: "center",
									flex: 1,
									padding: `0 ${SIDE}px`,
									backgroundColor: m.live ? "#000" : "#fff",
									color: fg,
									borderBottom:
										i === matches.length - 1
											? "none"
											: `1.5px solid ${m.live ? "#fff" : "#000"}`,
								}}
							>
								{/* live dot */}
								<div
									style={{
										display: "flex",
										width: 22,
										justifyContent: "flex-start",
									}}
								>
									{m.live ? (
										<div
											style={{
												display: "flex",
												width: 12,
												height: 12,
												borderRadius: 6,
												backgroundColor: "#fff",
											}}
										/>
									) : null}
								</div>

								{/* centered matchup: HOME  S – S  AWAY */}
								<div
									style={{
										display: "flex",
										flex: 1,
										flexDirection: "row",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<div
										className="font-blockKie"
										style={{
											display: "flex",
											width: 92,
											justifyContent: "flex-end",
											fontSize: 28,
											color: fg,
										}}
									>
										{m.home}
									</div>
									<div
										className="font-blockKie"
										style={{
											display: "flex",
											width: 140,
											justifyContent: "center",
											fontSize: scoreSize,
											color: fg,
										}}
									>
										{isPre ? "vs" : `${m.homeScore} – ${m.awayScore}`}
									</div>
									<div
										className="font-blockKie"
										style={{
											display: "flex",
											width: 92,
											justifyContent: "flex-start",
											fontSize: 28,
											color: fg,
										}}
									>
										{m.away}
									</div>
								</div>

								{/* status: live = white chip (black text), else plain */}
								<div
									style={{
										display: "flex",
										width: 132,
										justifyContent: "flex-end",
										alignItems: "center",
									}}
								>
									{m.live ? (
										<div
											style={{
												display: "flex",
												alignItems: "center",
												backgroundColor: "#fff",
												color: "#000",
												padding: "3px 11px",
											}}
										>
											<div
												className="font-geneva9"
												style={{ display: "flex", fontSize: 16, ...LABEL }}
											>
												{`LIVE ${m.detail}`.trim()}
											</div>
										</div>
									) : (
										<div
											className="font-geneva9"
											style={{
												display: "flex",
												fontSize: 17,
												color: fg,
												...LABEL,
											}}
										>
											{m.detail}
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>

				{/* ================= colophon ================= */}
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						height: 28,
						padding: `0 ${SIDE}px`,
						borderTop: "2px solid #000",
					}}
				>
					<div
						className="font-geneva9"
						style={{ display: "flex", fontSize: 15, ...LABEL }}
					>
						LIVE SCORES
					</div>
					<div
						className="font-geneva9"
						style={{ display: "flex", fontSize: 15, ...LABEL }}
					>
						{updatedLabel ? `UPDATED ${updatedLabel} · ESPN` : "ESPN"}
					</div>
				</div>
				<CheckerStrip width={width} />
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
		version: "0.3.0",
		createdAt: "2026-06-25T00:00:00Z",
		updatedAt: "2026-06-25T00:00:00Z",
		renderSettings: { supersample: true },
	},
	paramsSchema,
	dataSchema,
	getData: async (params) => getWorldCupData(params),
	Component: ({ width, height, data }) => (
		<WorldCup {...(data as WorldCupData)} width={width} height={height} />
	),
};
