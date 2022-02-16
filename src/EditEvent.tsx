import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { EventFrontmatter, SingleEventFrontmatter } from "./types";

function makeChangeListener<T>(
	setState: React.Dispatch<React.SetStateAction<T>>,
	fromString: (val: string) => T
): React.ChangeEventHandler<HTMLInputElement> {
	return (e) => setState(fromString(e.target.value));
}

interface DayChoiceProps {
	code: string;
	label: string;
	isSelected: boolean;
	onClick: (code: string) => void;
}
const DayChoice = ({ code, label, isSelected, onClick }: DayChoiceProps) => (
	<button
		type="button"
		style={{
			marginLeft: "0.25rem",
			marginRight: "0.25rem",
			padding: "0",
			backgroundColor: isSelected
				? "var(--interactive-accent)"
				: "var(--interactive-normal)",
			color: isSelected ? "var(--text-on-accent)" : "var(--text-normal)",
			borderStyle: "solid",
			borderWidth: "1px",
			borderRadius: "50%",
			width: "25px",
			height: "25px",
		}}
		onClick={() => onClick(code)}
	>
		<b>{label[0]}</b>
	</button>
);

const DAY_MAP = {
	U: "Sunday",
	M: "Monday",
	T: "Tuesday",
	W: "Wednesday",
	R: "Thursday",
	F: "Friday",
	S: "Saturday",
};

const DaySelect = ({
	value: days,
	onChange,
}: {
	value: string[];
	onChange: (days: string[]) => void;
}) => {
	return (
		<div>
			{Object.entries(DAY_MAP).map(([code, label]) => (
				<DayChoice
					key={code}
					code={code}
					label={label}
					isSelected={days.includes(code)}
					onClick={() =>
						days.includes(code)
							? onChange(days.filter((c) => c !== code))
							: onChange([code, ...days])
					}
				/>
			))}
		</div>
	);
};

interface EditEventProps {
	submit: (frontmatter: EventFrontmatter) => Promise<void>;
	initialEvent?: Partial<EventFrontmatter>;
	open?: () => Promise<void>;
}

export const EditEvent = ({ initialEvent, submit, open }: EditEventProps) => {
	const [date, setDate] = useState(
		initialEvent
			? initialEvent.type !== "recurring"
				? // Discriminated union on unset type not working well within Partial<>
				  (initialEvent as SingleEventFrontmatter).date
				: initialEvent.startRecur || ""
			: ""
	);

	let initialStartTime = "";
	let initialEndTime = "";
	if (initialEvent && initialEvent.allDay === false) {
		initialStartTime = initialEvent.startTime || "";
		initialEndTime = initialEvent.endTime || "";
	}

	const [startTime, setStartTime] = useState(initialStartTime);
	const [endTime, setEndTime] = useState(initialEndTime);
	const [title, setTitle] = useState(initialEvent?.title || "");
	const [isRecurring, setIsRecurring] = useState(
		initialEvent?.type === "recurring" || false
	);
	const [endDate, setEndDate] = useState("");
	const [daysOfWeek, setDaysOfWeek] = useState<string[]>(
		(initialEvent?.type === "recurring" ? initialEvent.daysOfWeek : []) ||
			[]
	);

	const [allDay, setAllDay] = useState(initialEvent?.allDay || false);

	const titleRef = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (titleRef.current) {
			titleRef.current.focus();
		}
	}, [titleRef]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		await submit({
			...{ title },
			...(allDay
				? { allDay: true }
				: { allDay: false, startTime, endTime }),
			...(isRecurring
				? {
						type: "recurring",
						daysOfWeek,
						startRecur: date || undefined,
						endRecur: endDate || undefined,
				  }
				: { date }),
		});
	};

	return (
		<>
			<p style={{ float: "right" }}>
				{open && <button onClick={open}>Open Note</button>}
			</p>

			<form onSubmit={handleSubmit}>
				<p>
					<input
						ref={titleRef}
						type="text"
						id="title"
						value={title}
						placeholder={"Add title"}
						required
						onChange={makeChangeListener(setTitle, (x) => x)}
					/>
				</p>
				<p>
					{!isRecurring && (
						<input
							type="date"
							id="date"
							value={date}
							required={!isRecurring}
							onChange={makeChangeListener(setDate, (x) => x)}
						/>
					)}

					{allDay ? (
						<></>
					) : (
						<>
							<input
								type="time"
								id="startTime"
								value={startTime}
								required
								onChange={makeChangeListener(
									setStartTime,
									(x) => x
								)}
							/>
							-
							<input
								type="time"
								id="endTime"
								value={endTime}
								required
								onChange={makeChangeListener(
									setEndTime,
									(x) => x
								)}
							/>
						</>
					)}
				</p>
				<p>
					<label htmlFor="allDay">All day event </label>
					<input
						id="allDay"
						checked={allDay}
						onChange={(e) => setAllDay(e.target.checked)}
						type="checkbox"
					/>
				</p>
				<p>
					<label htmlFor="recurring">Recurring Event </label>
					<input
						id="recurring"
						checked={isRecurring}
						onChange={(e) => setIsRecurring(e.target.checked)}
						type="checkbox"
					/>
				</p>

				{isRecurring && (
					<>
						<DaySelect
							value={daysOfWeek}
							onChange={setDaysOfWeek}
						/>
						<p>
							Starts recurring
							<input
								type="date"
								id="startDate"
								value={date}
								onChange={makeChangeListener(setDate, (x) => x)}
							/>
							and stops recurring
							<input
								type="date"
								id="endDate"
								value={endDate}
								onChange={makeChangeListener(
									setEndDate,
									(x) => x
								)}
							/>
						</p>
					</>
				)}

				<p>
					<input type="submit" />
				</p>
			</form>
		</>
	);
};