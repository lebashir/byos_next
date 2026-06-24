import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

// ---------------------------------------------------------------------------
// Brutalist / Swiss-poster Pokédex (Müller-Brockmann in 1-bit). A bold poster:
// the name + number reversed out of a black header bar, an enormous sprite in an
// outlined box, types as bold tags, stats as thick-outlined bars, flavour as a
// caption foot. The page stays PREDOMINANTLY WHITE — black is reserved for the
// header bar, the thick rules/outlines and the solid stat fills — so the e-ink
// panel stays balanced and ghost-free.
// Pure #000 / #fff. Flexbox + inline SVG only — no grid, filter, gradient,
// shadow or opacity — so it survives the takumi/Satori renderer. SVG children
// are wrapped in <g>, never a React Fragment (takumi drops Fragment-wrapped
// SVG nodes).
// ---------------------------------------------------------------------------

interface PokedexBrutalProps {
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

// Size the reversed-out name so the whole "#0025 PIKACHU" line fits inside the
// black header bar — long names step the font down rather than getting clipped.
function nameFontSize(s: string): number {
	const n = s.length;
	if (n <= 7) return 64;
	if (n <= 10) return 52;
	if (n <= 13) return 42;
	if (n <= 17) return 34;
	return 28;
}

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
}: PokedexBrutalProps) {
	// --- Empty / error state: a single black-on-white slogan, dead centre. ---
	if (message) {
		return (
			<PreSatori width={width} height={height}>
				<div
					className="bg-white text-black font-blockKie"
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width,
						height,
						backgroundColor: "#fff",
						color: "#000",
						padding: 48,
						textAlign: "center",
						boxSizing: "border-box",
					}}
				>
					<div
						className="font-blockKie"
						style={{ display: "flex", fontSize: 40, lineHeight: 1.1 }}
					>
						{message}
					</div>
				</div>
			</PreSatori>
		);
	}

	const RULE = 6;
	const STAT_MAX = 255;
	const TRACK_H = 18;
	const upperName = (name || "—").toUpperCase();

	return (
		<PreSatori width={width} height={height}>
			<div
				className="bg-white text-black font-blockKie"
				style={{
					display: "flex",
					flexDirection: "column",
					width,
					height,
					backgroundColor: "#fff",
					color: "#000",
					boxSizing: "border-box",
					overflow: "hidden",
				}}
			>
				{/* ============ BLACK HEADER BAR (the main ink accent) ============ */}
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						backgroundColor: "#000",
						paddingLeft: 20,
						paddingRight: 20,
						paddingTop: 6,
						paddingBottom: 6,
						boxSizing: "border-box",
						overflow: "hidden",
						flexShrink: 0,
					}}
				>
					<div
						className="font-blockKie"
						style={{
							display: "flex",
							color: "#fff",
							fontSize: nameFontSize(upperName),
							lineHeight: 1,
							letterSpacing: -1,
							overflow: "hidden",
						}}
					>
						{upperName}
					</div>
					<div
						className="font-blockKie"
						style={{
							display: "flex",
							color: "#fff",
							fontSize: 30,
							lineHeight: 1,
							marginLeft: 16,
							flexShrink: 0,
						}}
					>
						{number}
					</div>
				</div>

				{/* thick rule under the header */}
				<div style={{ height: RULE, backgroundColor: "#000", flexShrink: 0 }} />

				{/* ===================== BODY: sprite + stats ===================== */}
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						flex: 1,
						minHeight: 0,
						overflow: "hidden",
					}}
				>
					{/* LEFT: big sprite in an outlined box + genus caption. */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							width: 290,
							flexShrink: 0,
							padding: 14,
							boxSizing: "border-box",
							overflow: "hidden",
						}}
					>
						<div
							style={{
								display: "flex",
								flex: 1,
								minHeight: 0,
								border: `${RULE}px solid #000`,
								alignItems: "center",
								justifyContent: "center",
								backgroundColor: "#fff",
								boxSizing: "border-box",
								overflow: "hidden",
							}}
						>
							{spriteUrl ? (
								<img
									src={spriteUrl}
									alt={name}
									width={230}
									height={230}
									style={{
										width: 230,
										height: 230,
										imageRendering: "pixelated",
										objectFit: "contain",
									}}
								/>
							) : null}
						</div>
						{genus ? (
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									backgroundColor: "#000",
									marginTop: 10,
									paddingTop: 4,
									paddingBottom: 4,
									paddingLeft: 8,
									paddingRight: 8,
									boxSizing: "border-box",
									overflow: "hidden",
									flexShrink: 0,
								}}
							>
								<div
									className="font-blockKie"
									style={{
										display: "flex",
										color: "#fff",
										fontSize: 18,
										lineHeight: 1,
										textAlign: "center",
									}}
								>
									{genus.toUpperCase()}
								</div>
							</div>
						) : null}
					</div>

					{/* thick vertical rule between sprite + data */}
					<div
						style={{ width: RULE, backgroundColor: "#000", flexShrink: 0 }}
					/>

					{/* RIGHT: types, ht/wt, stats. */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							flex: 1,
							minWidth: 0,
							padding: 14,
							boxSizing: "border-box",
							overflow: "hidden",
						}}
					>
						{/* Type tags — bold outlined boxes (square, brutalist). */}
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								flexWrap: "wrap",
							}}
						>
							{types.map((t) => (
								<div
									key={t}
									className="font-blockKie"
									style={{
										display: "flex",
										border: "3px solid #000",
										paddingTop: 2,
										paddingBottom: 2,
										paddingLeft: 12,
										paddingRight: 12,
										marginRight: 8,
										marginBottom: 8,
										fontSize: 20,
										lineHeight: 1.1,
									}}
								>
									{t.toUpperCase()}
								</div>
							))}
						</div>

						{/* Height / weight. */}
						<div
							className="font-blockKie"
							style={{
								display: "flex",
								fontSize: 20,
								lineHeight: 1,
								marginBottom: 10,
							}}
						>
							HT {fmt(heightM)}M · WT {fmt(weightKg)}KG
						</div>

						{/* Stat bars — thick outlined tracks with solid black fills. */}
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								flex: 1,
								minHeight: 0,
								justifyContent: "space-between",
							}}
						>
							{stats.map((s) => {
								const ratio = Math.max(0, Math.min(1, s.value / STAT_MAX));
								return (
									<div
										key={s.label}
										style={{
											display: "flex",
											flexDirection: "row",
											alignItems: "center",
										}}
									>
										<div
											className="font-blockKie"
											style={{
												display: "flex",
												width: 72,
												fontSize: 16,
												lineHeight: 1,
												flexShrink: 0,
											}}
										>
											{s.label}
										</div>
										<div
											style={{
												display: "flex",
												flex: 1,
												minWidth: 0,
												height: TRACK_H,
												border: "3px solid #000",
												boxSizing: "border-box",
												overflow: "hidden",
											}}
										>
											<div
												style={{
													display: "flex",
													width: `${Math.round(ratio * 100)}%`,
													height: "100%",
													backgroundColor: "#000",
												}}
											/>
										</div>
										<div
											className="font-blockKie"
											style={{
												display: "flex",
												width: 40,
												fontSize: 16,
												lineHeight: 1,
												marginLeft: 8,
												justifyContent: "flex-end",
												flexShrink: 0,
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

				{/* thick rule above the flavour foot */}
				<div style={{ height: RULE, backgroundColor: "#000", flexShrink: 0 }} />

				{/* ===================== FLAVOUR FOOT (caption) ===================== */}
				<div
					style={{
						display: "flex",
						paddingTop: 8,
						paddingBottom: 8,
						paddingLeft: 20,
						paddingRight: 20,
						boxSizing: "border-box",
						overflow: "hidden",
						flexShrink: 0,
					}}
				>
					<div
						className="font-geneva9"
						style={{
							display: "flex",
							fontSize: 15,
							lineHeight: 1.3,
							maxHeight: 42,
							overflow: "hidden",
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
