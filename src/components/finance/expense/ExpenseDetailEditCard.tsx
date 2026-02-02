interface ExpenseDetailEditCardProps {
  isEditing: boolean;
}

const ExpenseDetailEditCard = ({ isEditing }: ExpenseDetailEditCardProps) => {
  if (isEditing) {
    return <div>ExpenseDetailEditCard</div>;
  }
  return null;
};

export default ExpenseDetailEditCard;
