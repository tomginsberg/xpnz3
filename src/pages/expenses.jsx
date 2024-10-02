// components/expenses.jsx
import AnimatedCard from "../components/animated-card.jsx";
import Masonry from "react-masonry-css";

export default function ExpensesTab({ expenses, onExpenseClick }) {
    // Sort expenses by date
    expenses.sort((a, b) => b.date - a.date);

    const breakpointColumnsObj = {
        default: 6,
        1100: 4,
        700: 3,
        500: 2,
    };

    return (
        <div className="mt-[140px] mx-4">
            <Masonry
                breakpointCols={breakpointColumnsObj}
                className="flex w-auto gap-4"
                columnClassName="masonry-column"
            >
                {expenses.map((expense) => (
                    <AnimatedCard
                        key={expense.id}
                        expense={expense}
                        onClick={onExpenseClick}
                    />
                ))}
            </Masonry>
        </div>
    );
}
