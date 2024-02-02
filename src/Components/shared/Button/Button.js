import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './Button.scss';

function Button({ className, danger, icon, label, ...rest }) {
	return (
		<button
			className={`button ${danger && 'button-danger'} ${className}`}
			{...rest}>
			{icon && <FontAwesomeIcon icon={icon} className='button-icon' />}
			{label}
		</button>
	);
}

export default Button;
