import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

// ---------------------------------------------------------------------------
// Brutalist / Swiss-poster "Who's That Pokémon?" (Müller-Brockmann in 1-bit). A
// stark poster: the question reversed out of a black header bar, the silhouette
// big and centred on a white field, and the reveal in ENORMOUS type at the foot
// (or a giant "?" when hidden). The page stays PREDOMINANTLY WHITE — black is
// reserved for the header bar, the thick rules and the silhouette itself — so
// the e-ink panel stays balanced and ghost-free.
// Pure #000 / #fff. Flexbox + inline SVG only — no grid, filter, gradient,
// shadow or opacity — so it survives the takumi/Satori renderer. The sprite is
// ALREADY a pure-black silhouette data URL, so it is drawn with a plain <img>
// (no CSS filter, which takumi ignores anyway).
// ---------------------------------------------------------------------------

interface WtpBrutalProps {
	name?: string;
	number?: string;
	spriteUrl?: string;
	reveal?: boolean;
	message?: string;
	width?: number;
	height?: number;
}

// Size the reveal headline so the whole "IT'S CHARIZARD!" line fits across the
// poster — long names step the font down rather than getting clipped.
function revealFontSize(s: string): number {
	const n = s.length;
	if (n <= 8) return 88;
	if (n <= 12) return 70;
	if (n <= 16) return 54;
	if (n <= 20) return 42;
	return 34;
}

export default function Wtp({
	name = "",
	number = "",
	spriteUrl = "",
	reveal = true,
	message,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
}: WtpBrutalProps) {
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

	const RULE = 7;
	const revealLine = `IT'S ${(name || "—").toUpperCase()}!`;

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
				{/* ============ BLACK HEADER BAR (the question) ============ */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						backgroundColor: "#000",
						paddingTop: 10,
						paddingBottom: 10,
						paddingLeft: 16,
						paddingRight: 16,
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
							fontSize: 46,
							lineHeight: 1,
							letterSpacing: 1,
							textAlign: "center",
						}}
					>
						WHO'S THAT POKéMON?
					</div>
				</div>

				{/* thick rule under the header */}
				<div style={{ height: RULE, backgroundColor: "#000", flexShrink: 0 }} />

				{/* ============ CENTRE: big silhouette on white ============ */}
				<div
					style={{
						display: "flex",
						flex: 1,
						minHeight: 0,
						alignItems: "center",
						justifyContent: "center",
						overflow: "hidden",
					}}
				>
					{spriteUrl ? (
						<img
							src={spriteUrl}
							alt="Silhouette"
							width={300}
							height={300}
							style={{
								width: 300,
								height: 300,
								objectFit: "contain",
								imageRendering: "pixelated",
							}}
						/>
					) : null}
				</div>

				{/* thick rule above the reveal foot */}
				<div style={{ height: RULE, backgroundColor: "#000", flexShrink: 0 }} />

				{/* ============ REVEAL FOOT — enormous type, or a giant "?" ============ */}
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "center",
						paddingTop: 8,
						paddingBottom: 8,
						paddingLeft: 16,
						paddingRight: 16,
						boxSizing: "border-box",
						overflow: "hidden",
						flexShrink: 0,
					}}
				>
					{reveal ? (
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								alignItems: "baseline",
								justifyContent: "center",
								overflow: "hidden",
							}}
						>
							<div
								className="font-blockKie"
								style={{
									display: "flex",
									fontSize: revealFontSize(revealLine),
									lineHeight: 1,
									letterSpacing: -1,
								}}
							>
								{revealLine}
							</div>
							<div
								className="font-geneva9"
								style={{
									display: "flex",
									fontSize: 18,
									marginLeft: 12,
									flexShrink: 0,
								}}
							>
								{number}
							</div>
						</div>
					) : (
						<div
							className="font-blockKie"
							style={{
								display: "flex",
								fontSize: 96,
								lineHeight: 1,
							}}
						>
							?
						</div>
					)}
				</div>
			</div>
		</PreSatori>
	);
}
