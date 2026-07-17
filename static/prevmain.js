
// Success message show function

  function ShowSuccessToast(message) {
        const toastContainer = document.getElementById('toastContainer');
        const toastHTML = `
            <div class="position-fixed top-0 start-50 translate-middle-x p-3" style="z-index: 9999;">
                <div id="formSuccessToast" class="toast align-items-center text-white bg-success border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                    ${message}
                        </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                </div>
            </div>
      `;
        toastContainer.innerHTML = toastHTML;

        setTimeout(() => {
            toastContainer.innerHTML = '';
        }, 3000);
    }













//Error message show function

    function ShowErrorToast(message) {
        const toastContainer = document.getElementById('toastContainer');
        const toastHTML = `
            <div class="position-fixed top-0 start-50 translate-middle-x p-3" style="z-index: 9999;">
                <div id="formErrorToast" class="toast align-items-center text-white bg-danger border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                    ${message}
                        </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                </div>
            </div>
      `;
        toastContainer.innerHTML = toastHTML;

        setTimeout(() => {
            toastContainer.innerHTML = '';
        }, 3000);
    }


    //Excel round to 0.000
    function excelRound(value, decimals = 1) {
        const multiplier = Math.pow(10, decimals);
        return (Math.round((value * multiplier) + Number.EPSILON) / multiplier).toFixed(decimals);
    }      

