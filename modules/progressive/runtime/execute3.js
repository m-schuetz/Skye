



// SINGLE_PROGRESS_STEP = true;
// doStep = true;

if(progToggle === 0){
	remainingBudget = 10 * 1000 * 1000;
	progToggle = 1;
}else if(progToggle === 1){
	remainingBudget = 100 * 1000;
	progToggle = 0;
}