// components/expenses.jsx
import AnimatedCard from "../components/animated-card.jsx";
import Masonry from "react-masonry-css";
import React, {useMemo} from "react";


export default function ExpensesTab({
                                        expenses,
                                        setExpenses,
                                        openEditDrawer,
}) {

    const onEditClick = (expense) => {
        openEditDrawer(expense);
    };

    const onCopyClick = (expense) => {
        setExpenses(prevExpenses => [
            ...prevExpenses,
            { ...expense, id: Math.random().toString(36).substr(2, 9) },
        ]);
    };

    const onDeleteClick = (expense) => {
        setExpenses(prevExpenses => prevExpenses.filter(e => e.id !== expense.id));
    };

    const sortedExpenses = useMemo(() => {
        return [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [expenses]);

    const breakpointColumnsObj = {
        default: 6,
        1100: 4,
        700: 3,
        500: 2,
    };

    const MemoizedCard = React.memo(AnimatedCard);


    return (
        <>
            <div className="mt-[150px] mx-4 mb-[100%]">
                <Masonry
                    breakpointCols={breakpointColumnsObj}
                    className="flex w-auto gap-4"
                    columnClassName="masonry-column"
                >
                    {sortedExpenses.map((expense) => (
                        <MemoizedCard
                            key={expense.id}
                            expense={expense}
                            onEditClick={() => onEditClick(expense)}
                            onCopyClick={() => onCopyClick(expense)}
                            onDeleteClick={() => onDeleteClick(expense)}
                        />
                    ))}
                </Masonry>
            </div>
        </>
    );
}
