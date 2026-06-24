import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

interface WtpProps {
	name?: string;
	number?: string;
	spriteUrl?: string;
	reveal?: boolean;
	message?: string;
	width?: number;
	height?: number;
}

export default function Wtp({
	name = "",
	number = "",
	spriteUrl = "",
	reveal = true,
	message,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
}: WtpProps) {
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
					alignItems: "center",
					justifyContent: "center",
					border: "3px solid #000",
					boxSizing: "border-box",
				}}
			>
				{message ? (
					<div
						className="font-blockKie"
						style={{
							display: "flex",
							textAlign: "center",
							fontSize: 28,
							padding: "0 40px",
						}}
					>
						{message}
					</div>
				) : (
					<>
						{/* TOP caption */}
						<div
							className="font-blockKie"
							style={{
								display: "flex",
								fontSize: 40,
								fontWeight: 700,
								letterSpacing: 2,
								textAlign: "center",
								marginBottom: 12,
							}}
						>
							WHO'S THAT POKéMON?
						</div>

						{/* CENTER hero: solid black silhouette */}
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								width: 280,
								height: 280,
							}}
						>
							{spriteUrl ? (
								<img
									src={spriteUrl}
									alt="Silhouette"
									width={280}
									height={280}
									style={{
										width: 280,
										height: 280,
										objectFit: "contain",
										imageRendering: "pixelated",
										filter: "brightness(0)",
									}}
								/>
							) : null}
						</div>

						{/* BOTTOM: reveal name + number, or a big "?" */}
						{reveal ? (
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									marginTop: 12,
								}}
							>
								<div
									className="font-blockKie"
									style={{ display: "flex", fontSize: 36, fontWeight: 700 }}
								>
									IT'S {name.toUpperCase()}!
								</div>
								<div
									className="font-blockKie"
									style={{ display: "flex", fontSize: 20, marginTop: 4 }}
								>
									{number}
								</div>
							</div>
						) : (
							<div
								className="font-blockKie"
								style={{
									display: "flex",
									fontSize: 48,
									fontWeight: 700,
									marginTop: 12,
								}}
							>
								?
							</div>
						)}
					</>
				)}
			</div>
		</PreSatori>
	);
}
