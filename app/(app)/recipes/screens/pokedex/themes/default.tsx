import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

interface PokedexProps {
	id?: number;
	name?: string;
	number?: string;
	genus?: string;
	types?: string[];
	heightM?: number;
	weightKg?: number;
	stats?: { label: string; value: number }[];
	spriteUrl?: string;
	flavor?: string;
	message?: string;
	width?: number;
	height?: number;
}

// Round to at most one decimal, dropping a trailing ".0".
const fmt = (n: number) => {
	const r = Math.round(n * 10) / 10;
	return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

function Pokedex({
	name = "",
	number = "",
	genus = "",
	types = [],
	heightM = 0,
	weightKg = 0,
	stats = [],
	spriteUrl = "",
	flavor = "",
	message,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
}: PokedexProps) {
	if (message) {
		return (
			<PreSatori width={width} height={height}>
				<div
					className="font-blockKie"
					style={{
						width,
						height,
						backgroundColor: "#fff",
						color: "#000",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontSize: 24,
						textAlign: "center",
						padding: 24,
					}}
				>
					{message}
				</div>
			</PreSatori>
		);
	}

	const HEADER = 56;
	const STAT_MAX = 255;
	const TRACK_W = 220;
	const TRACK_H = 16;

	return (
		<PreSatori width={width} height={height}>
			<div
				className="font-blockKie"
				style={{
					width,
					height,
					backgroundColor: "#fff",
					color: "#000",
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
				}}
			>
				{/* Header strip */}
				<div
					style={{
						height: HEADER,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "0 18px",
						borderBottom: "3px solid #000",
					}}
				>
					<div className="font-blockKie" style={{ fontSize: 22 }}>
						POKéDEX
					</div>
					<div className="font-blockKie" style={{ fontSize: 24 }}>
						{number}
						{number && name ? "  " : ""}
						{name.toUpperCase()}
					</div>
				</div>

				{/* Body: sprite box (left) + details (right) */}
				<div
					style={{
						flex: 1,
						display: "flex",
						padding: 14,
						gap: 14,
						overflow: "hidden",
					}}
				>
					{/* LEFT ~42% */}
					<div
						style={{
							width: "42%",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							overflow: "hidden",
						}}
					>
						<div
							style={{
								width: "100%",
								flex: 1,
								border: "3px solid #000",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								backgroundColor: "#fff",
								overflow: "hidden",
							}}
						>
							{spriteUrl ? (
								<img
									src={spriteUrl}
									alt={name}
									width={260}
									height={260}
									style={{
										width: 260,
										height: 260,
										imageRendering: "pixelated",
										objectFit: "contain",
									}}
								/>
							) : null}
						</div>
						<div
							className="font-blockKie"
							style={{
								fontSize: 18,
								marginTop: 8,
								textAlign: "center",
								width: "100%",
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
							}}
						>
							{genus}
						</div>
					</div>

					{/* RIGHT ~58% */}
					<div
						style={{
							width: "58%",
							display: "flex",
							flexDirection: "column",
							overflow: "hidden",
						}}
					>
						{/* Type badges */}
						<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
							{types.map((t) => (
								<div
									key={t}
									className="font-blockKie"
									style={{
										border: "2px solid #000",
										borderRadius: 999,
										padding: "2px 12px",
										fontSize: 18,
										lineHeight: 1.2,
									}}
								>
									{t.toUpperCase()}
								</div>
							))}
						</div>

						{/* Height / Weight */}
						<div
							className="font-blockKie"
							style={{ fontSize: 18, marginTop: 8 }}
						>
							HT {fmt(heightM)} m&nbsp;&nbsp;&nbsp;WT {fmt(weightKg)} kg
						</div>

						{/* Stat bars */}
						<div
							style={{
								marginTop: 8,
								display: "flex",
								flexDirection: "column",
								gap: 5,
							}}
						>
							{stats.map((s) => {
								const ratio = Math.max(0, Math.min(1, s.value / STAT_MAX));
								return (
									<div
										key={s.label}
										style={{ display: "flex", alignItems: "center" }}
									>
										<div
											className="font-blockKie"
											style={{ width: 58, fontSize: 16 }}
										>
											{s.label}
										</div>
										<div
											style={{
												width: TRACK_W,
												height: TRACK_H,
												border: "2px solid #000",
												display: "flex",
												alignItems: "stretch",
												overflow: "hidden",
											}}
										>
											<div
												style={{
													width: Math.round(ratio * (TRACK_W - 4)),
													height: "100%",
													backgroundColor: "#000",
												}}
											/>
										</div>
										<div
											className="font-blockKie"
											style={{
												width: 40,
												fontSize: 16,
												marginLeft: 8,
												textAlign: "right",
											}}
										>
											{s.value}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>

				{/* BOTTOM: flavor text, clipped to ~2 lines */}
				<div
					style={{
						borderTop: "3px solid #000",
						padding: "8px 18px",
						overflow: "hidden",
					}}
				>
					<div
						className="font-blockKie"
						style={{
							fontSize: 18,
							lineHeight: 1.25,
							display: "block",
							overflow: "hidden",
							maxHeight: 46,
						}}
					>
						{flavor}
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

export default Pokedex;
