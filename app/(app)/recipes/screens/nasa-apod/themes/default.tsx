import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

interface ApodProps {
	title?: string;
	imageUrl?: string;
	date?: string;
	copyright?: string;
	explanation?: string;
	message?: string;
	width?: number;
	height?: number;
}

// Truncate a single line so it fits the title bar without wrapping.
const clip = (s: string, max: number) =>
	s.length > max ? `${s.slice(0, Math.max(1, max - 1))}…` : s;

function Apod({
	title = "",
	imageUrl = "",
	date = "",
	copyright,
	message,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
}: ApodProps) {
	const BAR_H = 64;

	// Error / non-image state: centered message, black on white.
	if (message && !imageUrl) {
		return (
			<PreSatori width={width} height={height}>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						width,
						height,
						backgroundColor: "#fff",
						color: "#000",
						padding: 40,
						textAlign: "center",
					}}
				>
					{title ? (
						<div
							style={{
								fontSize: 32,
								fontWeight: 700,
								marginBottom: 16,
								color: "#000",
							}}
						>
							{title}
						</div>
					) : null}
					<div style={{ fontSize: 28, lineHeight: 1.3, color: "#000" }}>
						{message}
					</div>
					{date ? (
						<div style={{ fontSize: 20, marginTop: 16, color: "#000" }}>
							{date}
						</div>
					) : null}
				</div>
			</PreSatori>
		);
	}

	const rightLabel = copyright ? `${date}  ·  © ${copyright}` : date;

	// Full-bleed image with a solid black title bar pinned to the bottom.
	return (
		<PreSatori width={width} height={height}>
			<div
				style={{
					position: "relative",
					display: "flex",
					width,
					height,
					backgroundColor: "#000",
				}}
			>
				<picture
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width,
						height,
						display: "flex",
					}}
				>
					<source srcSet={imageUrl} />
					<img
						src={imageUrl}
						alt={title || "NASA Astronomy Picture of the Day"}
						width={width}
						height={height}
						style={{
							width,
							height,
							objectFit: "cover",
							// Lift brightness/contrast so dark astrophotos (nebulae on
							// black space) retain visible detail after 1-bit dithering.
							filter: "brightness(1.45) contrast(1.1)",
						}}
					/>
				</picture>

				<div
					style={{
						position: "absolute",
						left: 0,
						bottom: 0,
						width,
						height: BAR_H,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						backgroundColor: "#000",
						color: "#fff",
						padding: "0 16px",
					}}
				>
					<div
						style={{
							fontSize: 24,
							color: "#fff",
							flex: 1,
							overflow: "hidden",
							whiteSpace: "nowrap",
						}}
					>
						{clip(title, 48)}
					</div>
					{rightLabel ? (
						<div
							style={{
								fontSize: 16,
								color: "#fff",
								marginLeft: 16,
								whiteSpace: "nowrap",
								flexShrink: 0,
							}}
						>
							{rightLabel}
						</div>
					) : null}
				</div>
			</div>
		</PreSatori>
	);
}

export default Apod;
